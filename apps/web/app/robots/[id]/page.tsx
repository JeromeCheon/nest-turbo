import { notFound } from 'next/navigation';

import { RobotDetailView } from '@/components/robot-detail-view';
import { DUMMY_ROBOTS } from '@/lib/dummy-robots';

export default async function RobotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const robot = DUMMY_ROBOTS.find((r) => r.id === id);

  if (!robot) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <RobotDetailView robot={robot} />
    </div>
  );
}
