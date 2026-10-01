import { ActivityFeed } from '@/features/activity/components/activity-feed';
import { Card, CardBody } from '@/shared/ui/card';

export default async function ProjectActivityPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <Card>
      <CardBody>
        <ActivityFeed projectId={projectId} />
      </CardBody>
    </Card>
  );
}
