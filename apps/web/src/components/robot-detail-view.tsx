'use client';

import * as React from 'react';
import type { RobotDto, RobotPart } from '@repo/api';

import { buttonVariants } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import { ConnectionIndicator } from '@/components/connection-indicator';
import { HumanoidRobot } from '@/components/humanoid-robot';
import { LiveLogPanel, type LogEntry } from '@/components/live-log-panel';

const EMQX_DASHBOARD_URL = 'http://localhost:18083';

interface RobotDetailViewProps {
  robot: RobotDto;
}

function RobotDetailView({ robot }: RobotDetailViewProps) {
  const [activePart, setActivePart] = React.useState<RobotPart | null>(null);
  const [entries, setEntries] = React.useState<LogEntry[]>([]);

  const handlePartClick = (part: RobotPart) => {
    setActivePart(part);
    setEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), ts: Date.now(), direction: 'sent', part },
    ]);
  };

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{robot.name}</h1>
          <p className="text-muted-foreground text-sm">{robot.model}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={robot.status} />
          <ConnectionIndicator state="connected" />
          <a
            href={EMQX_DASHBOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            EMQX 대시보드
          </a>
        </div>
      </header>

      <section className="flex justify-center">
        {/* ponytail: MQTT 미연동 단계라 disabled 미배선. 실연동 Task에서
            실제 connectionState === 'disconnected'로 교체한다. */}
        <HumanoidRobot
          activePart={activePart}
          onPartClick={handlePartClick}
          onAnimationDone={() => setActivePart(null)}
        />
      </section>

      <section>
        <LiveLogPanel entries={entries} />
      </section>
    </>
  );
}

export { RobotDetailView };
