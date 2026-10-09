import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProjectAccessService } from './project-access.service';

const coordinator = { id: 'c1', organizationId: 'org-1', role: 'PROJECT_COORDINATOR' };
const member = { id: 'm1', organizationId: 'org-1', role: 'MEMBER' };

function setup({ isArchived = false, membership = null as object | null } = {}) {
  const prisma = {
    project: { findFirst: jest.fn().mockResolvedValue({ id: 'p1', organizationId: 'org-1', isArchived }) },
    projectMember: { findUnique: jest.fn().mockResolvedValue(membership) },
  };
  return new ProjectAccessService(prisma as never);
}

describe('ProjectAccessService.assertCanManageWritable', () => {
  it('lets a coordinator manage an active project', async () => {
    await expect(setup().assertCanManageWritable(coordinator as never, 'p1')).resolves.toMatchObject({ canManage: true });
  });

  it('refuses setup changes on an archived project', async () => {
    await expect(setup({ isArchived: true }).assertCanManageWritable(coordinator as never, 'p1')).rejects.toThrow(
      new BadRequestException('Archived projects are read-only'),
    );
  });

  it('still lets assertCanManage through on an archived project (restore and delete)', async () => {
    await expect(setup({ isArchived: true }).assertCanManage(coordinator as never, 'p1')).resolves.toMatchObject({ canManage: true });
  });

  it('refuses members before checking the archive state', async () => {
    const service = setup({ isArchived: true, membership: { role: 'MEMBER' } });
    await expect(service.assertCanManageWritable(member as never, 'p1')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
