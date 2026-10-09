/**
 * Seeds the platform root account and the default plans and, when SEED_DEMO_DATA=true,
 * a demo organization with its super admin, subscription and realistic demo data.
 * Account details live in seed-data.ts. Each step is idempotent, so the script is safe to re-run.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  ActivityAction,
  ApprovalStatus,
  DependencyType,
  EntityType,
  LookupType,
  StatusCategory,
  SubscriptionStatus,
} from '../src/common/constants/domain.constants';
import { OrgRole, PlatformRole, ProjectRole } from '../src/common/constants/roles.constants';
import { slugify } from '../src/common/utils/string.util';
import { DEFAULT_LOOKUPS } from '../src/features/lookups/lookup.defaults';
import { ORGANIZATION_DEFAULTS } from '../src/features/organizations/organization.defaults';
import { nextGroupColor } from '../src/features/task-lists/task-list.colors';
import { DEFAULT_PLANS, DEMO_ORGANIZATION, DEMO_PROJECTS, DEMO_USERS, ROOT_ACCOUNT } from './seed-data';

const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

const DAY = 86_400_000;
const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
const dayOffset = (days: number) => new Date(today.getTime() + days * DAY);

const saltRounds = () => Number(requireEnv('BCRYPT_SALT_ROUNDS'));

/** The platform root account: manages every organization, plan and subscription. */
async function seedRoot(): Promise<void> {
  const email = ROOT_ACCOUNT.email.toLowerCase();
  if (await prisma.user.findFirst({ where: { role: PlatformRole.ROOT } })) {
    console.log('✔ Root account already exists');
    return;
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    throw new Error(`Root email ${email} is already used by an organization user; change ROOT_ACCOUNT in seed-data.ts`);
  }
  await prisma.user.create({
    data: {
      organizationId: null,
      email,
      passwordHash: await bcrypt.hash(ROOT_ACCOUNT.password, saltRounds()),
      firstName: ROOT_ACCOUNT.firstName,
      lastName: ROOT_ACCOUNT.lastName,
      jobTitle: ROOT_ACCOUNT.jobTitle,
      role: PlatformRole.ROOT,
    },
  });
  console.log(`✔ Created root account ${email} (change its password after the first sign-in)`);
}

async function seedPlans(): Promise<void> {
  if (await prisma.plan.count()) {
    console.log('✔ Plans already exist');
    return;
  }
  const currency = requireEnv('DEFAULT_CURRENCY');
  await prisma.plan.createMany({ data: DEFAULT_PLANS.map((plan) => ({ ...plan, currency })) });
  console.log(`✔ Created ${DEFAULT_PLANS.length} plans`);
}

/** Gives the demo organization a subscription when it has none. */
async function seedSubscription(organizationId: string): Promise<void> {
  if (await prisma.subscription.count({ where: { organizationId } })) return;
  const code = DEMO_ORGANIZATION.planCode;
  const plan = await prisma.plan.findUnique({ where: { code } });
  if (!plan) throw new Error(`Demo plan code ${code} does not match any plan`);
  await prisma.subscription.create({
    data: { organizationId, planId: plan.id, status: SubscriptionStatus.ACTIVE, startDate: today, notes: 'Created by seed' },
  });
  console.log(`✔ Subscribed the organization to the ${plan.name} plan`);
}

/** Creates the demo organization, its super admin and demo data; returns the organization id. */
async function seedDemoOrganization(): Promise<string> {
  const { name: orgName, superAdmin } = DEMO_ORGANIZATION;
  const adminEmail = superAdmin.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing?.organizationId) {
    console.log(`✔ Super admin ${adminEmail} already exists`);
    return existing.organizationId;
  }

  // ─── Organization & workflow ────────────────────────────────
  const organization = await prisma.organization.create({
    data: { name: orgName, slug: slugify(orgName) || 'workspace', ...ORGANIZATION_DEFAULTS },
  });
  const positions = new Map<string, number>();
  await prisma.lookup.createMany({
    data: DEFAULT_LOOKUPS.map((seed) => {
      const position = positions.get(seed.type) ?? 0;
      positions.set(seed.type, position + 1);
      return { organizationId: organization.id, ...seed, category: seed.category ?? null, isDefault: !!seed.isDefault, position };
    }),
  });

  const admin = await prisma.user.create({
    data: {
      organizationId: organization.id,
      email: adminEmail,
      passwordHash: await bcrypt.hash(superAdmin.password, saltRounds()),
      firstName: superAdmin.firstName,
      lastName: superAdmin.lastName,
      jobTitle: superAdmin.jobTitle,
      role: OrgRole.SUPER_ADMIN,
    },
  });
  console.log(`✔ Created organization "${orgName}" and super admin ${adminEmail}`);

  // ─── Demo users ─────────────────────────────────────────────
  const domain = adminEmail.split('@')[1];
  const demoPasswordHash = await bcrypt.hash(DEMO_ORGANIZATION.userPassword, saltRounds());
  const users = [admin];
  for (const demo of DEMO_USERS) {
    users.push(
      await prisma.user.create({
        data: {
          organizationId: organization.id,
          email: `${demo.handle}@${domain}`,
          passwordHash: demoPasswordHash,
          firstName: demo.firstName,
          lastName: demo.lastName,
          jobTitle: demo.jobTitle,
          role: demo.role,
          hourlyRate: demo.hourlyRate,
        },
      }),
    );
  }
  const byHandle = (handle: string) => {
    const index = DEMO_USERS.findIndex((u) => u.handle === handle);
    return index === -1 ? admin : users[index + 1];
  };

  const lookups = await prisma.lookup.findMany({ where: { organizationId: organization.id } });
  const lookup = (type: LookupType, name: string) => {
    const found = lookups.find((l) => l.type === type && l.name === name);
    if (!found) throw new Error(`Seed references unknown ${type} "${name}"`);
    return found;
  };

  // ─── Demo projects ──────────────────────────────────────────
  for (const spec of DEMO_PROJECTS) {
    const owner = byHandle(spec.owner);
    const memberHandles = [...new Set([spec.owner, ...spec.members])];
    const project = await prisma.project.create({
      data: {
        organizationId: organization.id,
        key: spec.key,
        name: spec.name,
        description: spec.description,
        color: spec.color,
        statusId: lookup(LookupType.PROJECT_STATUS, spec.status).id,
        ownerId: owner.id,
        startDate: dayOffset(spec.startOffset),
        endDate: dayOffset(spec.endOffset),
        budgetHours: spec.budgetHours,
        members: {
          create: [
            ...(memberHandles.includes('admin') ? [] : [{ userId: admin.id, role: ProjectRole.MANAGER }]),
            ...memberHandles.map((handle) => ({
              userId: byHandle(handle).id,
              role: handle === spec.owner ? ProjectRole.MANAGER : ProjectRole.MEMBER,
            })),
          ],
        },
      },
    });

    const milestones = new Map<string, string>();
    for (const m of spec.milestones) {
      const milestone = await prisma.milestone.create({
        data: {
          projectId: project.id,
          name: m.name,
          description: m.description,
          startDate: dayOffset(m.startOffset),
          dueDate: dayOffset(m.dueOffset),
          ownerId: owner.id,
          completedAt: m.completed ? dayOffset(m.dueOffset) : null,
        },
      });
      milestones.set(m.name, milestone.id);
    }

    const taskIds = new Map<string, string>();
    let taskNumber = 0;
    for (const [listIndex, list] of spec.taskLists.entries()) {
      const taskList = await prisma.taskList.create({
        data: {
          projectId: project.id,
          name: list.name,
          color: nextGroupColor(listIndex),
          position: listIndex,
          milestoneId: milestones.get(list.milestone) ?? null,
        },
      });
      for (const t of list.tasks) {
        taskNumber++;
        const status = lookup(LookupType.TASK_STATUS, t.status);
        const closed = status.category === StatusCategory.CLOSED;
        const task = await prisma.task.create({
          data: {
            projectId: project.id,
            taskListId: taskList.id,
            milestoneId: milestones.get(list.milestone) ?? null,
            number: taskNumber,
            title: t.title,
            description: t.description ?? null,
            statusId: status.id,
            priorityId: lookup(LookupType.PRIORITY, t.priority).id,
            startDate: dayOffset(t.startOffset),
            dueDate: dayOffset(t.dueOffset),
            estimatedHours: t.estimate,
            progress: closed ? 100 : t.progress,
            position: taskNumber * 1024,
            createdById: owner.id,
            completedAt: closed ? dayOffset(t.dueOffset) : null,
            assignees: { create: t.assignees.map((handle) => ({ userId: byHandle(handle).id })) },
          },
        });
        taskIds.set(t.title, task.id);

        if (t.comment) {
          await prisma.comment.create({
            data: { taskId: task.id, authorId: byHandle(t.assignees[0] ?? spec.owner).id, body: t.comment },
          });
        }
        // Time logged on started tasks
        if (status.category !== StatusCategory.OPEN) {
          for (const handle of t.assignees) {
            for (let d = 0; d < Math.min(3, Math.max(1, Math.round(t.estimate / 8))); d++) {
              const date = dayOffset(Math.min(-1, t.startOffset + d));
              await prisma.timeEntry.create({
                data: {
                  userId: byHandle(handle).id,
                  projectId: project.id,
                  taskId: task.id,
                  date,
                  minutes: 60 * (2 + ((taskNumber + d) % 5)),
                  notes: `Worked on ${t.title.toLowerCase()}`,
                  isBillable: (taskNumber + d) % 4 !== 0,
                  approvalStatus: d === 0 && closed ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
                  approvedById: d === 0 && closed ? owner.id : null,
                  approvedAt: d === 0 && closed ? new Date() : null,
                },
              });
            }
          }
        }
      }
    }
    await prisma.project.update({ where: { id: project.id }, data: { taskCounter: taskNumber } });

    for (const [successor, predecessor] of spec.dependencies) {
      const successorId = taskIds.get(successor);
      const predecessorId = taskIds.get(predecessor);
      if (successorId && predecessorId) {
        await prisma.taskDependency.create({ data: { successorId, predecessorId, type: DependencyType.FINISH_TO_START } });
      }
    }

    for (const [index, issue] of spec.issues.entries()) {
      const status = lookup(LookupType.ISSUE_STATUS, issue.status);
      await prisma.issue.create({
        data: {
          projectId: project.id,
          number: index + 1,
          title: issue.title,
          description: issue.description,
          statusId: status.id,
          priorityId: lookup(LookupType.PRIORITY, issue.priority).id,
          severityId: lookup(LookupType.ISSUE_SEVERITY, issue.severity).id,
          reporterId: byHandle(issue.reporter).id,
          assigneeId: issue.assignee ? byHandle(issue.assignee).id : null,
          dueDate: dayOffset(issue.dueOffset),
          resolvedAt: status.category === StatusCategory.CLOSED ? dayOffset(-2) : null,
          createdAt: dayOffset(issue.createdOffset),
        },
      });
    }
    await prisma.project.update({ where: { id: project.id }, data: { issueCounter: spec.issues.length } });

    await prisma.activity.create({
      data: {
        organizationId: organization.id,
        projectId: project.id,
        actorId: owner.id,
        entityType: EntityType.PROJECT,
        entityId: project.id,
        action: ActivityAction.CREATED,
        summary: `created project ${project.name}`,
        // Projects starting in the future were still created "today".
        createdAt: dayOffset(Math.min(spec.startOffset, 0)),
      },
    });
    console.log(`✔ Seeded demo project ${spec.key} - ${spec.name}`);
  }

  console.log(`✔ Demo users sign in with DEMO_ORGANIZATION.userPassword (e.g. ${DEMO_USERS[0].handle}@${domain})`);
  return organization.id;
}

/** Gives groups created before group colors existed a color from the palette. */
async function backfillGroupColors(): Promise<void> {
  const uncolored = await prisma.taskList.findMany({ where: { color: null }, select: { id: true, position: true } });
  for (const group of uncolored) {
    await prisma.taskList.update({ where: { id: group.id }, data: { color: nextGroupColor(group.position) } });
  }
  if (uncolored.length) console.log(`✔ Colored ${uncolored.length} existing groups`);
}

async function main() {
  await seedRoot();
  await seedPlans();
  if (['true', '1', 'yes'].includes((process.env.SEED_DEMO_DATA ?? 'false').toLowerCase())) {
    await seedSubscription(await seedDemoOrganization());
  }
  await backfillGroupColors();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
