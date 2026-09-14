import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUserDto } from '../../../../packages/api/dist/entry';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUserDto =>
    context.switchToHttp().getRequest<Request & { user: AuthUserDto }>().user,
);
