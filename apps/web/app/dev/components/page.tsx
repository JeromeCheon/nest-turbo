'use client';

import { useState } from 'react';
import type { RobotPart, RobotStatus } from '@repo/api';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';
import {
  ConnectionIndicator,
  type ConnectionState,
} from '@/components/connection-indicator';
import { LiveLogPanel, type LogEntry } from '@/components/live-log-panel';
import { HumanoidRobot } from '@/components/humanoid-robot';

const statuses: RobotStatus[] = ['idle', 'active', 'error', 'offline'];
const connectionStates: ConnectionState[] = [
  'connected',
  'connecting',
  'disconnected',
];

export default function DevComponentsPage() {
  const [connection, setConnection] = useState<ConnectionState>('connected');
  const [activePart, setActivePart] = useState<RobotPart | null>(null);
  const [entries, setEntries] = useState<LogEntry[]>([]);

  const handlePartClick = (part: RobotPart) => {
    if (connection === 'disconnected') return;
    setActivePart(part);
    setEntries((prev) => [
      ...prev,
      {
        id: `${part}-${Date.now()}`,
        ts: Date.now(),
        direction: 'sent',
        part,
        status: 'active',
      },
    ]);
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">공통 컴포넌트 검증</h1>

      <section className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <StatusBadge key={status} status={status} />
        ))}
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <ConnectionIndicator state={connection} />
        {connectionStates.map((state) => (
          <Button
            key={state}
            size="sm"
            variant="outline"
            onClick={() => setConnection(state)}
          >
            {state}
          </Button>
        ))}
      </section>

      <section className="flex justify-center">
        <HumanoidRobot
          disabled={connection === 'disconnected'}
          activePart={activePart}
          onPartClick={handlePartClick}
          onAnimationDone={() => setActivePart(null)}
        />
      </section>

      <section>
        <LiveLogPanel entries={entries} />
      </section>
    </div>
  );
}
