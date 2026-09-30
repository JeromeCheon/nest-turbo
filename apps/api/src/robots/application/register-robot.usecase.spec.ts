import { Robot } from '../domain/robot.entity';
import { RobotRepository } from '../domain/robot.repository';
import { RegisterRobotUseCase } from './register-robot.usecase';

describe(RegisterRobotUseCase.name, () => {
  it('robotRepository.create에 idle 상태의 새 로봇을 넘기고 DTO를 돌려준다', async () => {
    const created = Robot.restore({
      id: 'robot-1',
      ownerId: 'user-1',
      name: 'Atlas',
      model: 'AT-1',
      status: 'idle',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const robotRepository = {
      findById: jest.fn(),
      listByOwner: jest.fn(),
      create: jest.fn().mockResolvedValue(created),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<RobotRepository>;
    const useCase = new RegisterRobotUseCase(robotRepository);

    const result = await useCase.execute({
      ownerId: 'user-1',
      name: 'Atlas',
      model: 'AT-1',
    });

    const [passedRobot] = robotRepository.create.mock.calls[0] as [Robot];
    expect(passedRobot.status).toBe('idle');
    expect(passedRobot.isOwnedBy('user-1')).toBe(true);
    expect(result).toEqual({
      id: 'robot-1',
      name: 'Atlas',
      model: 'AT-1',
      status: 'idle',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });
});
