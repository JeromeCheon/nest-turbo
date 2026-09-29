import type { LoginDto, RegisterDto } from '@repo/api';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterRequest implements RegisterDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  email!: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다' })
  @MaxLength(72, { message: '비밀번호는 72자 이하여야 합니다' })
  password!: string;
}

export class LoginRequest implements LoginDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  email!: string;

  @IsString()
  @MinLength(1, { message: '비밀번호를 입력하세요' })
  password!: string;
}
