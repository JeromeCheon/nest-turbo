'use client';

import * as React from 'react';
import Link from 'next/link';

import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRobotStore } from '@/lib/robot-store';

export function RobotView() {
  const viewMode = useRobotStore((s) => s.viewMode);
  const setViewMode = useRobotStore((s) => s.setViewMode);
  const robots = useRobotStore((s) => s.robots);

  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // ponytail: 더미 로딩 흉내, 실연동 Task에서 실제 fetch 대기로 교체
    const timer = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant={viewMode === 'card' ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setViewMode('card')}
        >
          카드형
        </Button>
        <Button
          type="button"
          variant={viewMode === 'list' ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          리스트형
        </Button>
      </div>

      {isLoading ? (
        <RobotViewSkeleton viewMode={viewMode} />
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {robots.map((robot) => (
            <Link
              key={robot.id}
              href={`/robots/${robot.id}`}
              className="rounded-lg border border-border p-4 transition-colors hover:bg-muted"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{robot.name}</span>
                <StatusBadge status={robot.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {robot.model}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {robots.map((robot) => (
            <Link
              key={robot.id}
              href={`/robots/${robot.id}`}
              className="flex items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-muted"
            >
              <div>
                <span className="font-medium">{robot.name}</span>
                <p className="text-sm text-muted-foreground">{robot.model}</p>
              </div>
              <StatusBadge status={robot.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function RobotViewSkeleton({ viewMode }: { viewMode: 'list' | 'card' }) {
  if (viewMode === 'card') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
