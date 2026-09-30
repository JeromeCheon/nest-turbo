import { Injectable } from '@nestjs/common';

import type { Robot as RobotRow } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { Robot } from '../domain/robot.entity';
import { RobotRepository } from '../domain/robot.repository';
import { toRobotStatus } from '../domain/robot-status.vo';

@Injectable()
export class PrismaRobotRepository implements RobotRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findById(id: string): Promise<Robot | null> {
    const row = await this.prismaService.robot.findUnique({
      where: {
        id,
      },
    });

    return row ? this.toDomain(row) : null;
  }

  async listByOwner(ownerId: string): Promise<Robot[]> {
    const rows = await this.prismaService.robot.findMany({
      where: {
        ownerId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async create(robot: Robot): Promise<Robot> {
    const row = await this.prismaService.robot.create({
      data: {
        ownerId: robot.ownerId,
        name: robot.name,
        model: robot.model,
        status: robot.status,
      },
    });
    return this.toDomain(row);
  }

  async updateStatus(robot: Robot): Promise<void> {
    await this.prismaService.robot.update({
      data: {
        status: robot.status,
      },
      where: {
        id: robot.id,
      },
    });
  }

  private toDomain(row: RobotRow): Robot {
    return Robot.restore({
      ...row,
      status: toRobotStatus(row.status),
    });
  }
}
