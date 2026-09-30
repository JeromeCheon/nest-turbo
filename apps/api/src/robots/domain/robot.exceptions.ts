import { DomainException } from '../../common/domain.exception';

export class RobotNotFoundError extends DomainException {
  constructor() {
    super('해당 로봇이 존재하지 않습니다.', 404);
  }
}

export class InvalidRobotPartError extends DomainException {
  constructor(raw: string) {
    super(`유효하지 않은 로봇 부위입니다: ${raw}`, 400);
  }
}

export class InvalidRobotStatusError extends DomainException {
  constructor(raw: string) {
    super(`유효하지 않은 로봇 상태값입니다: ${raw}`, 500);
  }
}
