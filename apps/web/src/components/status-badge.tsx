import type { RobotStatus } from '@repo/api';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const statusBadgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      status: {
        idle: 'bg-muted text-muted-foreground',
        active: 'bg-primary/10 text-primary',
        error: 'bg-destructive/10 text-destructive',
        offline: 'bg-secondary text-secondary-foreground',
      } satisfies Record<RobotStatus, string>,
    },
    defaultVariants: {
      status: 'idle',
    },
  },
);

interface StatusBadgeProps
  extends
    React.ComponentProps<'span'>,
    VariantProps<typeof statusBadgeVariants> {
  status: RobotStatus;
}

function StatusBadge({ className, status, ...props }: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      className={cn(statusBadgeVariants({ status, className }))}
      {...props}
    >
      {status}
    </span>
  );
}

export { StatusBadge, statusBadgeVariants };
