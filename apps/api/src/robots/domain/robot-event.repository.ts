import { RobotEvent } from './robot-event.entity';

export abstract class RobotEventRepository {
  abstract create(event: RobotEvent): Promise<RobotEvent>;
}
