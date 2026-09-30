import { Injectable } from '@nestjs/common';
import type { RobotDto } from '@repo/api';

import { RobotRepository } from '../domain/robot.repository';

@Injectable()
export class ListRobotsUseCase {
  constructor(private readonly robotRepository: RobotRepository) {}

  async execute(ownerId: string): Promise<RobotDto[]> {
    const robots = await this.robotRepository.listByOwner(ownerId);
    return robots.map((robot) => robot.toDto());
  }
}
