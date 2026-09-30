import { InvalidRobotEventSourceError } from './robot.exceptions';
import type { RobotEventSource } from './robot-event.entity';

export const ROBOT_EVENT_SOURCES = [
  'web',
  'system',
] as const satisfies readonly RobotEventSource[];

export function isRobotEventSource(raw: string): raw is RobotEventSource {
  return (ROBOT_EVENT_SOURCES as readonly string[]).includes(raw);
}

export function toRobotEventSource(raw: string): RobotEventSource {
  if (!isRobotEventSource(raw)) {
    throw new InvalidRobotEventSourceError(raw);
  }

  return raw;
}
