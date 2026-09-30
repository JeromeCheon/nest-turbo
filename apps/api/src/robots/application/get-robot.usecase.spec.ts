import { Robot } from '../domain/robot.entity';
import { RobotNotFoundError } from '../domain/robot.exceptions';
import { RobotRepository } from '../domain/robot.repository';
import { GetRobotUseCase } from './get-robot.usecase';

const ownedRobot = Robot.restore({
  id: 'robot-1',
  ownerId: 'user-1',
  name: 'Atlas',
  model: 'AT-1',
  status: 'idle',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
});

function build(found: Robot | null): GetRobotUseCase {
  const robots = {
    findById: jest.fn().mockResolvedValue(found),
    listByOwner: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
  } as unknown as RobotRepository;

  return new GetRobotUseCase(robots);
}

async function capture(promise: Promise<unknown>): Promise<RobotNotFoundError> {
  try {
    await promise;
  } catch (error) {
    return error as RobotNotFoundError;
  }

  throw new Error('RobotNotFound가 발생하지 않았습니다');
}

describe(GetRobotUseCase.name, () => {
  it('내 로봇이면 DTO를 돌려준다', async () => {
    await expect(
      build(ownedRobot).execute('robot-1', 'user-1'),
    ).resolves.toEqual({
      id: 'robot-1',
      name: 'Atlas',
      model: 'AT-1',
      status: 'idle',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('남의 로봇이면 RobotNotFound', async () => {
    await expect(
      build(ownedRobot).execute('robot-1', 'user-2'),
    ).rejects.toBeInstanceOf(RobotNotFoundError);
  });

  it('존재하지 않으면 같은 RobotNotFound', async () => {
    await expect(
      build(null).execute('robot-404', 'user-1'),
    ).rejects.toBeInstanceOf(RobotNotFoundError);
  });

  it('두 경우의 status와 message가 같아 존재 여부가 드러나지 않는다', async () => {
    const mismatch = await capture(
      build(ownedRobot).execute('robot-1', 'user-2'),
    );
    const missing = await capture(build(null).execute('robot-404', 'user-1'));

    expect(mismatch.message).toBe(missing.message);
    expect(mismatch.status).toBe(404);
    expect(missing.status).toBe(404);
  });
});
