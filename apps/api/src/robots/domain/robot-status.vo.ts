import type { RobotStatus } from '@repo/api';
import { InvalidRobotStatusError } from './robot.exceptions';

export const ROBOT_STATUSES = [
  'idle',
  'active',
  'offline',
  'error',
] as const satisfies readonly RobotStatus[];

export function isRobotStatus(raw: string): raw is RobotStatus {
  return (ROBOT_STATUSES as readonly string[]).includes(raw);
}

export function toRobotStatus(raw: string): RobotStatus {
  if (!isRobotStatus(raw)) {
    throw new InvalidRobotStatusError(raw);
  }
  return raw;
}
