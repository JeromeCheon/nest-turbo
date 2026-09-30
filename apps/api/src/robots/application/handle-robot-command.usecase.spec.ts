import { Robot } from '../domain/robot.entity';
import { RobotEventRepository } from '../domain/robot-event.repository';
import { RobotRepository } from '../domain/robot.repository';
import { RobotCommandPublisher } from '../domain/robot-command.publisher';
import { HandleRobotCommandUseCase } from './handle-robot-command.usecase';

const ownedRobot = Robot.restore({
  id: 'robot-1',
  ownerId: 'user-1',
  name: 'Atlas',
  model: 'AT-1',
  status: 'idle',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
});

function build(found: Robot | null) {
  const robotRepository = {
    findById: jest.fn().mockResolvedValue(found),
    listByOwner: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
  } as unknown as jest.Mocked<RobotRepository>;

  const robotEventRepository = {
    create: jest.fn(),
  } as unknown as jest.Mocked<RobotEventRepository>;

  const robotCommandPublisher = {
    publishState: jest.fn(),
  } as unknown as jest.Mocked<RobotCommandPublisher>;

  const useCase = new HandleRobotCommandUseCase(
    robotRepository,
    robotEventRepository,
    robotCommandPublisher,
  );

  return {
    useCase,
    robotRepository,
    robotEventRepository,
    robotCommandPublisher,
  };
}

describe(HandleRobotCommandUseCase.name, () => {
  it('알 수 없는 로봇이면 아무 것도 하지 않는다', async () => {
    const { useCase, robotEventRepository, robotCommandPublisher } =
      build(null);

    await useCase.execute({
      robotId: 'robot-404',
      part: 'eyeLeft',
      payload: {},
      source: 'web',
      ownerId: 'user-1',
    });

    expect(robotEventRepository.create).not.toHaveBeenCalled();
    expect(robotCommandPublisher.publishState).not.toHaveBeenCalled();
  });

  it('web 커맨드에서 ownerId가 없으면 거부한다', async () => {
    const { useCase, robotRepository, robotEventRepository } =
      build(ownedRobot);

    await useCase.execute({
      robotId: 'robot-1',
      part: 'eyeLeft',
      payload: {},
      source: 'web',
    });

    expect(robotRepository.updateStatus).not.toHaveBeenCalled();
    expect(robotEventRepository.create).not.toHaveBeenCalled();
  });

  it('web 커맨드에서 다른 사용자의 로봇이면 거부한다', async () => {
    const { useCase, robotEventRepository } = build(ownedRobot);

    await useCase.execute({
      robotId: 'robot-1',
      part: 'eyeLeft',
      payload: {},
      source: 'web',
      ownerId: 'user-2',
    });

    expect(robotEventRepository.create).not.toHaveBeenCalled();
  });

  it('system 커맨드는 ownerId 없이도 실행된다', async () => {
    const {
      useCase,
      robotRepository,
      robotEventRepository,
      robotCommandPublisher,
    } = build(ownedRobot);

    await useCase.execute({
      robotId: 'robot-1',
      part: 'eyeLeft',
      payload: {},
      source: 'system',
    });

    expect(robotEventRepository.create).toHaveBeenCalled();
    expect(robotCommandPublisher.publishState).toHaveBeenCalled();
    expect(robotRepository.updateStatus).toHaveBeenCalled();
  });

  it('성공 시 이벤트 기록·상태 발행 후 상태를 커밋한다', async () => {
    const {
      useCase,
      robotRepository,
      robotEventRepository,
      robotCommandPublisher,
    } = build(ownedRobot);
    const callOrder: string[] = [];
    robotEventRepository.create.mockImplementation(async (event) => {
      callOrder.push('event');
      return event;
    });
    robotCommandPublisher.publishState.mockImplementation(async () => {
      callOrder.push('publish');
    });
    robotRepository.updateStatus.mockImplementation(async () => {
      callOrder.push('status');
    });

    await useCase.execute({
      robotId: 'robot-1',
      part: 'armLeft',
      payload: { angle: 90 },
      source: 'web',
      ownerId: 'user-1',
    });

    expect(callOrder).toEqual(['event', 'publish', 'status']);
    expect(robotCommandPublisher.publishState).toHaveBeenCalledWith(
      'robot-1',
      expect.objectContaining({ part: 'armLeft', status: 'active' }),
    );
  });
});
