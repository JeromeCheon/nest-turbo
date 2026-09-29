import { Injectable } from '@nestjs/common';
import { UserRepository } from '../domain/user.repository';
import { AuthUserDto } from '@repo/api';
import { UserNotFoundError } from '../domain/auth.exceptions';

@Injectable()
export class GetMeUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string): Promise<AuthUserDto> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    return user.toDto();
  }
}
