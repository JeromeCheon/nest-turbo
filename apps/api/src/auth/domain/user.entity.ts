import { AuthUserDto } from '@repo/api';
import { Email } from './email.vo';
import { PasswordHash } from './password-hash.vo';
import { PasswordHasher } from './password-hasher';

export class User {
  private constructor(
    readonly id: string,
    readonly email: Email,
    readonly passwordHash: PasswordHash,
    readonly createdAt: Date,
  ) {}

  static register(email: Email, passwordHash: PasswordHash): User {
    return new User('', email, passwordHash, new Date());
  }

  static restore(props: {
    id: string;
    email: Email;
    passwordHash: PasswordHash;
    createdAt: Date;
  }): User {
    return new User(props.id, props.email, props.passwordHash, props.createdAt);
  }

  async verifyPassword(
    value: string,
    hasher: PasswordHasher,
  ): Promise<boolean> {
    return await hasher.compare(value, this.passwordHash.value);
  }

  toDto(): AuthUserDto {
    return {
      id: this.id,
      email: this.email.value,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
