import { IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterRobotRequest {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  model!: string;
}
