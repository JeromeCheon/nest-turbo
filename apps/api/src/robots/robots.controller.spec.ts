import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/current-user.decorator';
import { GetRobotUseCase } from './application/get-robot.usecase';
import { ListRobotsUseCase } from './application/list-robots.usecase';
import { RegisterRobotUseCase } from './application/register-robot.usecase';
import { RobotsController } from './robots.controller';

const user: AuthenticatedUser = { id: 'user-1', email: 'a@b.com' };

describe('RobotsController', () => {
  let controller: RobotsController;
  let listRobotsUseCase: { execute: jest.Mock };
  let getRobotUseCase: { execute: jest.Mock };
  let registerRobotUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    listRobotsUseCase = { execute: jest.fn() };
    getRobotUseCase = { execute: jest.fn() };
    registerRobotUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RobotsController],
      providers: [
        { provide: ListRobotsUseCase, useValue: listRobotsUseCase },
        { provide: GetRobotUseCase, useValue: getRobotUseCase },
        { provide: RegisterRobotUseCase, useValue: registerRobotUseCase },
      ],
    }).compile();

    controller = module.get<RobotsController>(RobotsController);
  });

  it('JwtAuthGuard로 보호된다', () => {
    const guards: unknown[] = Reflect.getMetadata(
      GUARDS_METADATA,
      RobotsController,
    );

    expect(guards).toContain(JwtAuthGuard);
  });

  it('list는 로그인한 사용자 id로 위임한다', async () => {
    listRobotsUseCase.execute.mockResolvedValue([]);

    await controller.list(user);

    expect(listRobotsUseCase.execute).toHaveBeenCalledWith('user-1');
  });

  it('register는 요청 바디에 로그인한 사용자 id를 강제로 주입한다', async () => {
    registerRobotUseCase.execute.mockResolvedValue({});

    await controller.register(user, { name: 'Atlas', model: 'AT-1' });

    expect(registerRobotUseCase.execute).toHaveBeenCalledWith({
      name: 'Atlas',
      model: 'AT-1',
      ownerId: 'user-1',
    });
  });

  it('detail은 대상 로봇 id와 로그인한 사용자 id를 함께 전달한다', async () => {
    getRobotUseCase.execute.mockResolvedValue({});

    await controller.detail(user, 'robot-1');

    expect(getRobotUseCase.execute).toHaveBeenCalledWith('robot-1', 'user-1');
  });
});
