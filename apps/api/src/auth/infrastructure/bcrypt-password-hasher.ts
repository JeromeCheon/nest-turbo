import { Injectable } from '@nestjs/common';
import { PasswordHasher } from '../domain/password-hasher';
import { compare, hash } from 'bcryptjs';

const SALT_BOUND = 10;

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return hash(plain, SALT_BOUND);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return compare(plain, hash);
  }
}
