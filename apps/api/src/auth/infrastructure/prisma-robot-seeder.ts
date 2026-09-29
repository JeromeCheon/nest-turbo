import { Injectable } from '@nestjs/common';
import { RobotSeeder } from '../domain/robot-seeder';
import { PrismaService } from '../../prisma/prisma.service';

const DEFAULT_ROBOTS = [
  { name: 'Atlas', model: 'AT-1' },
  { name: 'Nova', model: 'NV-2' },
  { name: 'Pixel', model: 'PX-3' },
];

@Injectable()
export class PrismaRobotSeeder implements RobotSeeder {
  constructor(private readonly prismaService: PrismaService) {}

  async seedDefaults(ownerId: string): Promise<void> {
    await this.prismaService.robot.createMany({
      data: DEFAULT_ROBOTS.map((robot) => ({ ...robot, ownerId })),
    });
  }
}
