import { Robot } from '../domain/robot.entity';
import { RobotRepository } from '../domain/robot.repository';
import { ListRobotsUseCase } from './list-robots.usecase';

describe(ListRobotsUseCase.name, () => {
  it('소유자의 로봇 목록을 DTO 배열로 돌려준다', async () => {
    const robots = [
      Robot.restore({
        id: 'robot-1',
        ownerId: 'user-1',
        name: 'Atlas',
        model: 'AT-1',
        status: 'idle',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    ];
    const robotRepository = {
      findById: jest.fn(),
      listByOwner: jest.fn().mockResolvedValue(robots),
      create: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<RobotRepository>;
    const useCase = new ListRobotsUseCase(robotRepository);

    const result = await useCase.execute('user-1');

    expect(robotRepository.listByOwner).toHaveBeenCalledWith('user-1');
    expect(result).toEqual([
      {
        id: 'robot-1',
        name: 'Atlas',
        model: 'AT-1',
        status: 'idle',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
  });

  it('로봇이 없으면 빈 배열을 돌려준다', async () => {
    const robotRepository = {
      findById: jest.fn(),
      listByOwner: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<RobotRepository>;
    const useCase = new ListRobotsUseCase(robotRepository);

    await expect(useCase.execute('user-1')).resolves.toEqual([]);
  });
});
