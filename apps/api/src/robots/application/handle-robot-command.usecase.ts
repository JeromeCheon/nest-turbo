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
    await this.robotEventRepository.create(
      RobotEvent.record({
        robotId,
        part,
        source,
        payload,
      }),
    );
    await this.robotCommandPublisher.publishState(robotId, state);
    // ponytail: 이벤트 기록·발행이 끝난 뒤에 상태를 커밋해, 둘 중 하나가 실패해도
    // DB 상태가 먼저 앞서가지 않게 함. 완전한 원자성(트랜잭션/outbox)은 두 리포지토리
    // 경계를 넘어야 해서 Task 012가 실제 호출부를 붙일 때 다시 검토.
    await this.robotRepository.updateStatus(robot);
  }
}
