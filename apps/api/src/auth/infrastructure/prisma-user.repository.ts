import { Injectable } from '@nestjs/common';
import { UserRepository } from '../domain/user.repository';
import { Prisma, type User as UserRow } from '@prisma/client';
import { Email } from '../domain/email.vo';
import { User } from '../domain/user.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordHash } from '../domain/password-hash.vo';
import { EmailAlreadyInUseError } from '../domain/auth.exceptions';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.prismaService.user.findUnique({
      where: {
        email: email.value,
      },
    });

    return row ? this.toDomain(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });

    return row ? this.toDomain(row) : null;
  }
  async create(user: User): Promise<User> {
    try {
      const row = await this.prismaService.user.create({
        data: {
          email: user.email.value,
          passwordHash: user.passwordHash.value,
        },
      });

      return this.toDomain(row);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new EmailAlreadyInUseError(user.email.value);
      }
      throw e;
    }
  }

  private toDomain(row: UserRow): User {
    return User.restore({
      id: row.id,
      email: Email.create(row.email),
      passwordHash: PasswordHash.create(row.passwordHash),
      createdAt: row.createdAt,
    });
  }
}
