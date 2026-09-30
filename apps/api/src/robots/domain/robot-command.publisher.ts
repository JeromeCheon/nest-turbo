import type { RobotStatePayload } from '@repo/api';

export abstract class RobotCommandPublisher {
  abstract publishState(
    robotId: string,
    payload: RobotStatePayload,
  ): Promise<void>;
}
