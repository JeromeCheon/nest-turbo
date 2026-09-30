import { Injectable, Logger } from '@nestjs/common';
import type { RobotPart } from '@repo/api';

import { RobotCommandPublisher } from '../domain/robot-command.publisher';
import {
  RobotEvent,
  type RobotEventSource,
} from '../domain/robot-event.entity';
import { RobotEventRepository } from '../domain/robot-event.repository';
import { RobotRepository } from '../domain/robot.repository';

export interface HandleRobotCommandInput {
  robotId: string;
  part: RobotPart;
  payload: Record<string, unknown>;
  source: RobotEventSource;
  ownerId?: string;
}

@Injectable()
export class HandleRobotCommandUseCase {
  private readonly logger = new Logger(HandleRobotCommandUseCase.name);

  constructor(
    private readonly robotRepository: RobotRepository,
    private readonly robotEventRepository: RobotEventRepository,
    private readonly robotCommandPublisher: RobotCommandPublisher,
  ) {}

  async execute({
    robotId,
    part,
    payload,
    source,
    ownerId,
  }: HandleRobotCommandInput): Promise<void> {
    const robot = await this.robotRepository.findById(robotId);
    if (!robot) {
      this.logger.warn(`알 수 없는 로봇의 커맨드 무시: ${robotId}`);
      return;
    }

    if (
      source === 'web' &&
      (ownerId === undefined || !robot.isOwnedBy(ownerId))
    ) {
      this.logger.warn(`소유자가 아닌 커맨드 무시: ${robotId}`);
      return;
    }

    const state = robot.applyCommand(part);
    await this.robotRepository.updateStatus(robot);
    await this.robotEventRepository.create(
      RobotEvent.record({
        robotId,
        part,
        source,
        payload,
      }),
    );
    await this.robotCommandPublisher.publishState(robotId, state);
  }
}
