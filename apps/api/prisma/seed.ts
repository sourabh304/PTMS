/**
 * Seeds the database with an organization, an administrator and (optionally)
 * realistic demo data. Every input comes from environment variables, see .env.example.
 * The script is idempotent: it does nothing when the admin account already exists.
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
} from '../src/common/constants/domain.constants';
import { OrgRole, ProjectRole } from '../src/common/constants/roles.constants';
import { slugify } from '../src/common/utils/string.util';
import { DEFAULT_LOOKUPS } from '../src/features/lookups/lookup.defaults';
import { ORGANIZATION_DEFAULTS } from '../src/features/organizations/organization.defaults';
import { DEMO_PROJECTS, DEMO_USERS } from './seed-data';

const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

const DAY = 86_400_000;
const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
const dayOffset = (days: number) => new Date(today.getTime() + days * DAY);

async function main() {
  const orgName = requireEnv('SEED_ORG_NAME');
  const adminEmail = requireEnv('SEED_ADMIN_EMAIL').toLowerCase();
  const adminPassword = requireEnv('SEED_ADMIN_PASSWORD');
  const saltRounds = Number(requireEnv('BCRYPT_SALT_ROUNDS'));
  const withDemo = ['true', '1', 'yes'].includes((process.env.SEED_DEMO_DATA ?? 'false').toLowerCase());

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingAdmin) {
    // Databases created before the root admin existed: promote the setup admin.
    if (!existingAdmin.isRootAdmin) {
      await prisma.user.update({ where: { id: existingAdmin.id }, data: { isRootAdmin: true } });
      console.log(`✔ ${adminEmail} is now the root administrator`);
    }
    console.log(`✔ Admin ${adminEmail} already exists - skipping seed`);
    return;
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
      passwordHash: await bcrypt.hash(adminPassword, saltRounds),
      firstName: requireEnv('SEED_ADMIN_FIRST_NAME'),
      lastName: requireEnv('SEED_ADMIN_LAST_NAME'),
      jobTitle: 'Administrator',
      role: OrgRole.OWNER,
      isRootAdmin: true,
    },
  });
  console.log(`✔ Created organization "${orgName}" and root administrator ${adminEmail}`);

  if (!withDemo) return;

  // ─── Demo users ─────────────────────────────────────────────
  const domain = adminEmail.split('@')[1];
  const demoPasswordHash = await bcrypt.hash(requireEnv('SEED_DEMO_USER_PASSWORD'), saltRounds);
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
        data: { projectId: project.id, name: list.name, position: listIndex, milestoneId: milestones.get(list.milestone) ?? null },
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

  console.log(`✔ Demo users can sign in with the SEED_DEMO_USER_PASSWORD value (e.g. ${DEMO_USERS[0].handle}@${domain})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
