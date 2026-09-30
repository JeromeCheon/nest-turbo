import { Injectable } from '@nestjs/common';
import type { RobotDto } from '@repo/api';

import { RobotRepository } from '../domain/robot.repository';
import { Robot } from '../domain/robot.entity';

@Injectable()
export class RegisterRobotUseCase {
  constructor(private readonly robotRepository: RobotRepository) {}

  async execute(input: {
    ownerId: string;
    name: string;
    model: string;
  }): Promise<RobotDto> {
    const robot = await this.robotRepository.create(Robot.register(input));
    return robot.toDto();
  }
}
