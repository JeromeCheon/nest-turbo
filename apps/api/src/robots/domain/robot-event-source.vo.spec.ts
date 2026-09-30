import { InvalidRobotEventSourceError } from './robot.exceptions';
import {
  isRobotEventSource,
  ROBOT_EVENT_SOURCES,
  toRobotEventSource,
} from './robot-event-source.vo';

describe('RobotEventSource', () => {
  it('허용 source는 정확히 2개다', () => {
    expect(ROBOT_EVENT_SOURCES).toEqual(['web', 'system']);
  });

  it.each(ROBOT_EVENT_SOURCES)('%s는 유효한 source다', (source) => {
    expect(isRobotEventSource(source)).toBe(true);
    expect(toRobotEventSource(source)).toBe(source);
  });

  it.each(['WEB', 'mobile', ''])('"%s"는 거부한다', (raw) => {
    expect(isRobotEventSource(raw)).toBe(false);
    expect(() => toRobotEventSource(raw)).toThrow(InvalidRobotEventSourceError);
  });

  it('거부는 500 도메인 예외로 나간다', () => {
    const error = new InvalidRobotEventSourceError('mobile');

    expect(error.status).toBe(500);
    expect(error.name).toBe('InvalidRobotEventSourceError');
  });
});
