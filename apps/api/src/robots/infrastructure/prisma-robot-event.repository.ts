import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { RobotEvent } from '../domain/robot-event.entity';
import { RobotEventRepository } from '../domain/robot-event.repository';
import { toRobotPart } from '../domain/robot-part.vo';

@Injectable()
export class PrismaRobotEventRepository implements RobotEventRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(event: RobotEvent): Promise<RobotEvent> {
    const row = await this.prismaService.robotEvent.create({
      data: {
        robotId: event.robotId,
        part: event.part,
        source: event.source,
        payload: JSON.stringify(event.payload),
      },
    });
    return RobotEvent.restore({
      ...row,
      payload: JSON.parse(row.payload),
      part: toRobotPart(row.part),
      source: row.source === 'system' ? row.source : 'web',
    });
  }
}
