import {
  ArgumentsHost,
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionFilter } from './all-exceptions.filter';
import { ResponseInterceptor } from './response.interceptor';
import { lastValueFrom, of } from 'rxjs';
import { DomainException } from './domain.exception';

class EmailAlreadyInUse extends DomainException {
  constructor() {
    super('이미 가입된 이메일입니다', 409);
  }
}

function mockHost() {
  const json = jest.fn();
  const status = jest.fn((_status: number) => ({ json }));
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe(ResponseInterceptor.name, () => {
  it('성공 응답을 래퍼로 감싼다', async () => {
    const interceptor = new ResponseInterceptor<string>();
    const next = { handle: () => of('ok') } as CallHandler<string>;

    const result = await lastValueFrom(
      interceptor.intercept({} as ExecutionContext, next),
    );

    expect(result).toEqual({ success: true, data: 'ok', error: null });
  });
});

describe(AllExceptionFilter.name, () => {
  let filter: AllExceptionFilter;

  beforeEach(() => {
    filter = new AllExceptionFilter();
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  it('class-validator 실패는 VALIDATION + 첫 메시지', () => {
    const { host, status, json } = mockHost();

    filter.catch(
      new BadRequestException({
        statusCode: 400,
        message: ['email must be an email', 'password too short'],
        error: 'Bad Request',
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: { code: 'VALIDATION', message: 'email must be an email' },
    });
  });

  it('도메인 예외는 클래스명 UPPER_CASE + 자기 status', () => {
    const { host, status, json } = mockHost();

    filter.catch(new EmailAlreadyInUse(), host);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        code: 'EMAIL_ALREADY_IN_USE',
        message: '이미 가입된 이메일입니다',
      },
    });
  });
  it('HttpException은 상태 코드 이름을 code로 쓴다', () => {
    const { host, status, json } = mockHost();

    filter.catch(new NotFoundException('로봇을 찾을 수 없습니다'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: { code: 'NOT_FOUND', message: '로봇을 찾을 수 없습니다' },
    });
  });

  it('예상 못 한 에러는 INTERNAL로 덮고 내용을 노출하지 않는다', () => {
    const { host, status, json } = mockHost();

    filter.catch(new TypeError('robot.id of undefined'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: { code: 'INTERNAL', message: 'Internal server error' },
    });
  });
});
