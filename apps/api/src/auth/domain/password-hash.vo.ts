import { InvalidPasswordHashError } from './auth.exceptions';

export class PasswordHash {
  private constructor(readonly value: string) {}

  static create(hash: string): PasswordHash {
    if (!hash.startsWith('$2')) {
      throw new InvalidPasswordHashError();
    }

    return new PasswordHash(hash);
  }
}
