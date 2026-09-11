import type { RobotPart, RobotStatus } from '../robots/entities/robot.entity';

export interface RobotCommandPayload {
  ts: number;
  clientId: string;
  action: 'click';
}

export interface RobotStatePayload {
  part: RobotPart;
  status: RobotStatus;
  ts: number;
}

const ROBOT_PARTS: readonly RobotPart[] = [
  'eyeLeft',
  'eyeRight',
  'armLeft',
  'armRight',
  'legLeft',
  'legRight',
];

export function commandTopic(robotId: string, part: RobotPart): string {
  return `robot/${robotId}/command/${part}`;
}

export function stateTopic(robotId: string): string {
  return `robot/${robotId}/state`;
}

export function parseCommandTopic(
  topic: string,
): { robotId: string; part: RobotPart } | null {
  const match = topic.match(/^robot\/([^/]+)\/command\/([^/]+)$/);
  if (!match) return null;

  const [, robotId, part] = match;
  if (!ROBOT_PARTS.includes(part as RobotPart)) return null;

  return { robotId: robotId!, part: part as RobotPart };
}
