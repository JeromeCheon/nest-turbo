import { DomainException } from '../../common/domain.exception';

export class InvalidEmailError extends DomainException {
  constructor(value: string) {
    super(`올바른 이메일 형식이 아닙니다: ${value}`, 400);
  }
}

export class InvalidPasswordHashError extends DomainException {
  constructor() {
    super('비밀번호 해시 형식이 올바르지 않습니다.', 500);
  }
}

export class EmailAlreadyInUseError extends DomainException {
  constructor(email: string) {
    super(`이미 사용 중인 이메일입니다: ${email}`, 409);
  }
}

export class InvalidCredentialsError extends DomainException {
  constructor() {
    super('이메일 또는 비밀번호가 일치하지 않습니다.', 401);
  }
}

export class InvalidRefreshSessionError extends DomainException {
  constructor() {
    super('유효하지 않거나 만료된 리프레시 토큰 세션입니다.', 401);
  }
}

export class UserNotFoundError extends DomainException {
  constructor() {
    super('사용자를 찾을 수 없습니다.', 404);
  }
}
