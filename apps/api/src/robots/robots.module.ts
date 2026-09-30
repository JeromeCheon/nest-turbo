import { Module } from '@nestjs/common';

import { GetRobotUseCase } from './application/get-robot.usecase';
import { ListRobotsUseCase } from './application/list-robots.usecase';
import { RegisterRobotUseCase } from './application/register-robot.usecase';
import { RobotEventRepository } from './domain/robot-event.repository';
import { RobotRepository } from './domain/robot.repository';
import { PrismaRobotEventRepository } from './infrastructure/prisma-robot-event.repository';
import { PrismaRobotRepository } from './infrastructure/prisma-robot.repository';
import { RobotsController } from './robots.controller';

@Module({
  controllers: [RobotsController],
  providers: [
    ListRobotsUseCase,
    GetRobotUseCase,
    RegisterRobotUseCase,
    { provide: RobotRepository, useClass: PrismaRobotRepository },
    { provide: RobotEventRepository, useClass: PrismaRobotEventRepository },
  ],
})
export class RobotsModule {}
