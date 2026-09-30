import { Injectable } from '@nestjs/common';
import type { RobotDto } from '@repo/api';

import { RobotRepository } from '../domain/robot.repository';
import { RobotNotFoundError } from '../domain/robot.exceptions';

@Injectable()
export class GetRobotUseCase {
  constructor(private readonly robotRepository: RobotRepository) {}

  async execute(robotId: string, ownerId: string): Promise<RobotDto> {
    const robot = await this.robotRepository.findById(robotId);
    if (!robot) {
      throw new RobotNotFoundError();
    }

    if (!robot.isOwnedBy(ownerId)) {
      throw new RobotNotFoundError();
    }

    return robot.toDto();
  }
}
