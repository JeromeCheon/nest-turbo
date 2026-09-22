import { RobotRegisterDialog } from '@/components/robot-register-dialog';
import { RobotView } from '@/components/robot-view';

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">대시보드</h1>
        <RobotRegisterDialog />
      </div>
      <RobotView />
    </div>
  );
}
