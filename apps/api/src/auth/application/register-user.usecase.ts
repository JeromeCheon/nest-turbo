import { Injectable } from '@nestjs/common';
import { UserRepository } from '../domain/user.repository';
import { PasswordHasher } from '../domain/password-hasher';
import { RobotSeeder } from '../domain/robot-seeder';
import { AuthUserDto, RegisterDto } from '@repo/api';
import { Email } from '../domain/email.vo';
import { EmailAlreadyInUseError } from '../domain/auth.exceptions';
import { PasswordHash } from '../domain/password-hash.vo';
import { User } from '../domain/user.entity';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly robotSeeder: RobotSeeder,
  ) {}

  async execute(input: RegisterDto): Promise<AuthUserDto> {
    const email = Email.create(input.email);

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new EmailAlreadyInUseError(input.email);
    }
    const hash = await this.hasher.hash(input.password);
    const passwordHash = PasswordHash.create(hash);
    const user = await this.userRepository.create(
      User.register(email, passwordHash),
    );

    await this.robotSeeder.seedDefaults(user.id);

    return user.toDto();
  }
}
