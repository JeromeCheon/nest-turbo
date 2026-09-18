import { Wifi, WifiOff } from 'lucide-react';
import { cn } from 'cn';

export type ConnectionState = 'connected' | 'connecting' | 'disconnected';

interface ConnectionIndicatorProps extends React.ComponentProps<'span'> {
  state: ConnectionState;
}

const stateLabel: Record<ConnectionState, string> = {
  connected: '연결됨',
  connecting: '연결 중',
  disconnected: '연결 끊김',
};

function ConnectionIndicator({
  state,
  className,
  ...props
}: ConnectionIndicatorProps) {
  const Icon = state === 'disconnected' ? WifiOff : Wifi;

  return (
    <span
      data-slot="connection-indicator"
      className={cn(
        'inline-flex items-center gap-1.5 text-sm',
        state === 'connected' && 'text-primary',
        state === 'connecting' && 'text-muted-foreground animate-pulse',
        state === 'disconnected' && 'text-destructive',
        className,
      )}
      {...props}
    >
      <Icon className="size-4" />
      {stateLabel[state]}
    </span>
  );
}

export { ConnectionIndicator };
