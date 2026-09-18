import type { RobotPart, RobotStatus } from '@repo/api';
import { cn } from 'cn';

interface LogEntry {
  id: string;
  ts: number;
  direction: 'sent' | 'received';
  part: RobotPart;
  status?: RobotStatus;
}

interface LiveLogPanelProps extends React.ComponentProps<'div'> {
  entries: LogEntry[];
}

function LiveLogPanel({ entries, className, ...props }: LiveLogPanelProps) {
  const recent = entries.slice(-50);

  return (
    <div
      data-slot="live-log-panel"
      className={cn(
        'max-h-64 overflow-y-auto rounded-md border border-border sm:max-h-80',
        className,
      )}
      {...props}
    >
      <ul className="divide-y divide-border text-sm">
        {recent.length === 0 && (
          <li className="text-muted-foreground px-3 py-2">로그 없음</li>
        )}
        {recent.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center justify-between gap-2 px-3 py-1.5"
          >
            <span className="text-muted-foreground">
              {new Date(entry.ts).toLocaleTimeString()}
            </span>
            <span
              className={cn(
                'font-medium',
                entry.direction === 'sent' ? 'text-primary' : 'text-foreground',
              )}
            >
              {entry.direction === 'sent' ? '→' : '←'} {entry.part}
            </span>
            {entry.status && (
              <span className="text-muted-foreground">{entry.status}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export { LiveLogPanel };
export type { LogEntry };
