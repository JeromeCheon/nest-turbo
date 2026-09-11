import { RobotPart } from './robot.entity';

export interface RobotEventDto {
  id: string;
  robotId: string;
  part: RobotPart;
  source: 'web' | 'system';
  payload: Record<string, unknown>;
  createdAt: string; // ISO 8601
}
