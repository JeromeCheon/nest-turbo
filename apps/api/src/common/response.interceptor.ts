import {
  ExecutionContext,
  CallHandler,
  NestInterceptor,
  Injectable,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ApiEnvelope<T> {
  data: T;
  success: true;
  error: null;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiEnvelope<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiEnvelope<T>> {
    return next.handle().pipe(
      map((data) => ({
        data,
        success: true as const,
        error: null,
      })),
    );
  }
}
