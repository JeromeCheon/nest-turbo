import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import type { Response } from 'express';
import { DomainException } from './domain.exception';

export interface ApiErrorEnvelope {
  success: false;
  data: null;
  error: { code: string; message: string };
}

function toErrorCode(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
}

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof BadRequestException) {
      const payload = exception.getResponse() as {
        message?: string | string[];
      };

      if (Array.isArray(payload.message)) {
        this.send(
          response,
          HttpStatus.BAD_REQUEST,
          'VALIDATION',
          payload.message[0] ?? exception.message,
        );
        return;
      }
    }

    if (exception instanceof DomainException) {
      this.send(
        response,
        exception.status,
        toErrorCode(exception.name),
        exception.message,
      );
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      this.send(
        response,
        status,
        HttpStatus[status] ?? 'HTTP_ERROR',
        exception.message,
      );
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );
    this.send(
      response,
      HttpStatus.INTERNAL_SERVER_ERROR,
      'INTERNAL',
      'Internal server error',
    );
  }

  private send(
    response: Response,
    status: number,
    code: string,
    message: string,
  ): void {
    const body: ApiErrorEnvelope = {
      success: false,
      data: null,
      error: {
        code,
        message,
      },
    };

    response.status(status).json(body);
  }
}
