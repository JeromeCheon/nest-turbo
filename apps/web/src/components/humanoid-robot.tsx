import type { KeyboardEvent } from 'react';
import type { RobotPart } from '@repo/api';
import { cn } from 'cn';

interface HumanoidRobotProps {
  className?: string;
  disabled?: boolean;
  activePart?: RobotPart | null;
  onPartClick?: (part: RobotPart) => void;
  onAnimationDone?: (part: RobotPart) => void;
}

interface PartConfig {
  part: RobotPart;
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rx?: number;
}

const parts: PartConfig[] = [
  { part: 'eyeLeft', cx: 42, cy: 30, r: 5 },
  { part: 'eyeRight', cx: 58, cy: 30, r: 5 },
  { part: 'armLeft', x: 18, y: 55, width: 12, height: 40, rx: 6 },
  { part: 'armRight', x: 70, y: 55, width: 12, height: 40, rx: 6 },
  { part: 'legLeft', x: 38, y: 105, width: 10, height: 35, rx: 5 },
  { part: 'legRight', x: 52, y: 105, width: 10, height: 35, rx: 5 },
];

function HumanoidRobot({
  className,
  disabled = false,
  activePart,
  onPartClick,
  onAnimationDone,
}: HumanoidRobotProps) {
  const handleClick = (part: RobotPart) => {
    if (disabled) return;
    onPartClick?.(part);
  };

  const handleKeyDown = (
    part: RobotPart,
    event: KeyboardEvent<SVGGElement>,
  ) => {
    if (disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onPartClick?.(part);
    }
  };

  return (
    <svg
      data-slot="humanoid-robot"
      viewBox="0 0 100 150"
      className={cn(
        'w-48 sm:w-64 md:w-72',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      {/* 머리 + 몸통 (클릭 불가 배경) */}
      <rect
        x="30"
        y="10"
        width="40"
        height="35"
        rx="8"
        className="fill-muted"
      />
      <rect
        x="25"
        y="50"
        width="50"
        height="60"
        rx="8"
        className="fill-muted"
      />

      {parts.map((config) => (
        <g
          key={config.part}
          data-part={config.part}
          data-active={activePart === config.part ? '' : undefined}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={config.part}
          aria-pressed={activePart === config.part}
          onClick={() => handleClick(config.part)}
          onKeyDown={(event) => handleKeyDown(config.part, event)}
          onAnimationEnd={() => onAnimationDone?.(config.part)}
          className="fill-foreground cursor-pointer outline-none hover:fill-primary/40 focus-visible:fill-primary/40 data-[active]:animate-flash"
        >
          {config.r !== undefined ? (
            <circle cx={config.cx} cy={config.cy} r={config.r} />
          ) : (
            <rect
              x={config.x}
              y={config.y}
              width={config.width}
              height={config.height}
              rx={config.rx}
            />
          )}
        </g>
      ))}
    </svg>
  );
}

export { HumanoidRobot };
