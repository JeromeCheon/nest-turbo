import { Robot } from './robot.entity';

export abstract class RobotRepository {
  abstract findById(id: string): Promise<Robot | null>;
  abstract listByOwner(ownerId: string): Promise<Robot[]>;
  abstract create(robot: Robot): Promise<Robot>;
  abstract updateStatus(robot: Robot): Promise<void>;
}
