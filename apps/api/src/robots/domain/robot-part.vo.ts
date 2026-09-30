import type { RobotPart } from '@repo/api';
import { InvalidRobotPartError } from './robot.exceptions';

export const ROBOT_PARTS = [
  'eyeLeft',
  'eyeRight',
  'armLeft',
  'armRight',
  'legLeft',
  'legRight',
] as const satisfies readonly RobotPart[];

export function isRobotPart(raw: string): raw is RobotPart {
  return (ROBOT_PARTS as readonly string[]).includes(raw);
}

export function toRobotPart(raw: string): RobotPart {
  if (!isRobotPart(raw)) {
    throw new InvalidRobotPartError(raw);
  }

  return raw;
}
