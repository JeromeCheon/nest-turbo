import { Robot } from './robot.entity';
import { ROBOT_STATUSES } from './robot-status.vo';

const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const COMMANDED_AT = new Date('2026-02-01T09:30:00.000Z');

function robotWith(status: (typeof ROBOT_STATUSES)[number]): Robot {
  return Robot.restore({
    id: 'robot-1',
    ownerId: 'user-1',
    name: 'Atlas',
    model: 'AT-1',
    status,
    createdAt: CREATED_AT,
  });
}

describe(Robot.name, () => {
  it('register는 idle 상태로 만든다', () => {
    const robot = Robot.register({
      ownerId: 'user-1',
      name: 'Atlas',
      model: 'AT-1',
    });

    expect(robot.status).toBe('idle');
    expect(robot.isOwnedBy('user-1')).toBe(true);
  });

  it.each(ROBOT_STATUSES)(
    '%s 상태에서 applyCommand하면 active가 된다',
    (status) => {
      const robot = robotWith(status);

      const state = robot.applyCommand('eyeLeft', COMMANDED_AT);

      expect(robot.status).toBe('active');
      expect(state).toEqual({
        part: 'eyeLeft',
        status: 'active',
        ts: COMMANDED_AT.getTime(),
      });
    },
  );

  it('연속 커맨드에도 active를 유지하고 마지막 부위를 돌려준다', () => {
    const robot = robotWith('idle');

    robot.applyCommand('armLeft', COMMANDED_AT);
    const state = robot.applyCommand('legRight', COMMANDED_AT);

    expect(robot.status).toBe('active');
    expect(state.part).toBe('legRight');
  });

  it('isOwnedBy는 소유자에게만 true', () => {
    const robot = robotWith('idle');

    expect(robot.isOwnedBy('user-1')).toBe(true);
    expect(robot.isOwnedBy('user-2')).toBe(false);
  });

  it('toDto는 ownerId를 노출하지 않는다', () => {
    expect(robotWith('idle').toDto()).toEqual({
      id: 'robot-1',
      name: 'Atlas',
      model: 'AT-1',
      status: 'idle',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });
});
