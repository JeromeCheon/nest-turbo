export type RobotStatus = 'idle' | 'active' | 'offline' | 'error';

export type RobotPart =
  | 'eyeLeft'
  | 'eyeRight'
  | 'armLeft'
  | 'armRight'
  | 'legLeft'
  | 'legRight';

export interface RobotDto {
  id: string;
  name: string;
  model: string;
  status: RobotStatus;
  createdAt: string; // ISO 8601
}
