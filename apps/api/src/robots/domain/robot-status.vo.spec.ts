import { InvalidRobotStatusError } from './robot.exceptions';
import {
  isRobotStatus,
  ROBOT_STATUSES,
  toRobotStatus,
} from './robot-status.vo';

describe('RobotStatus', () => {
  it('허용 상태값은 정확히 4개다', () => {
    expect(ROBOT_STATUSES).toEqual(['idle', 'active', 'offline', 'error']);
  });

  it.each(ROBOT_STATUSES)('%s는 유효한 상태값이다', (status) => {
    expect(isRobotStatus(status)).toBe(true);
    expect(toRobotStatus(status)).toBe(status);
  });

  it.each(['ACTIVE', 'running', ''])('"%s"는 거부한다', (raw) => {
    expect(isRobotStatus(raw)).toBe(false);
    expect(() => toRobotStatus(raw)).toThrow(InvalidRobotStatusError);
  });

  it('거부는 500 도메인 예외로 나간다', () => {
    const error = new InvalidRobotStatusError('running');

    expect(error.status).toBe(500);
    expect(error.name).toBe('InvalidRobotStatusError');
  });
});
