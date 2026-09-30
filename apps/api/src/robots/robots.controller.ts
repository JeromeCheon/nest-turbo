import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { RobotDto } from '@repo/api';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthenticatedUser } from '../common/current-user.decorator';
import { GetRobotUseCase } from './application/get-robot.usecase';
import { ListRobotsUseCase } from './application/list-robots.usecase';
import { RegisterRobotUseCase } from './application/register-robot.usecase';
import { RegisterRobotRequest } from './dto/robot.request';

@Controller('robots')
@UseGuards(JwtAuthGuard)
export class RobotsController {
  constructor(
    private readonly listRobotsUseCase: ListRobotsUseCase,
    private readonly getRobotUseCase: GetRobotUseCase,
    private readonly registerRobotUseCase: RegisterRobotUseCase,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser): Promise<RobotDto[]> {
    return await this.listRobotsUseCase.execute(user.id);
  }

  @Post()
  async register(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: RegisterRobotRequest,
  ): Promise<RobotDto> {
    return await this.registerRobotUseCase.execute({
      ...body,
      ownerId: user.id,
    });
  }

  @Get(':id')
  async detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<RobotDto> {
    return await this.getRobotUseCase.execute(id, user.id);
  }
}
