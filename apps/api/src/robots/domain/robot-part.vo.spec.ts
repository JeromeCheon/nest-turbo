import { InvalidRobotPartError } from './robot.exceptions';
import { isRobotPart, ROBOT_PARTS, toRobotPart } from './robot-part.vo';

describe('RobotPart', () => {
  it('허용 부위는 정확히 6개다', () => {
    expect(ROBOT_PARTS).toEqual([
      'eyeLeft',
      'eyeRight',
      'armLeft',
      'armRight',
      'legLeft',
      'legRight',
    ]);
  });

  it.each(ROBOT_PARTS)('%s는 유효한 부위다', (part) => {
    expect(isRobotPart(part)).toBe(true);
    expect(toRobotPart(part)).toBe(part);
  });

  it.each(['head', 'torso', 'eyeleft', 'EYELEFT', 'arm', ''])(
    '"%s"는 거부한다',
    (raw) => {
      expect(isRobotPart(raw)).toBe(false);
      expect(() => toRobotPart(raw)).toThrow(InvalidRobotPartError);
    },
  );

  it('거부는 400 도메인 예외로 나간다', () => {
    const error = new InvalidRobotPartError('head');

    expect(error.status).toBe(400);
    expect(error.name).toBe('InvalidRobotPartError');
  });
});
