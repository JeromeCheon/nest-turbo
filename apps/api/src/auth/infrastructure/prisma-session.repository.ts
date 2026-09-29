import { Injectable } from '@nestjs/common';
import { SessionRepository } from '../domain/session.repository';
import { Session } from '../domain/session.entity';
import { PrismaService } from '../../prisma/prisma.service';
import type { Session as SessionRow } from '@prisma/client';

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(session: Session): Promise<Session> {
    const row = await this.prismaService.session.create({
      data: this.toCreateData(session),
    });

    return this.toDomain(row);
  }

  async findByRefreshTokenHash(hash: string): Promise<Session | null> {
    const row = await this.prismaService.session.findUnique({
      where: {
        refreshTokenHash: hash,
      },
    });

    return row ? this.toDomain(row) : null;
  }

  async save(session: Session): Promise<void> {
    await this.prismaService.session.update({
      where: { id: session.id },
      data: { revokedAt: session.revokedAt },
    });
  }

  async rotate(current: Session, next: Session): Promise<void> {
    await this.prismaService.$transaction([
      this.prismaService.session.update({
        where: { id: current.id },
        data: { revokedAt: current.revokedAt },
      }),
      this.prismaService.session.create({ data: this.toCreateData(next) }),
    ]);
  }

  private toCreateData(session: Session) {
    return {
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      userAgent: session.userAgent,
      expiresAt: session.expiresAt,
    };
  }

  private toDomain(row: SessionRow): Session {
    return Session.restore({
      ...row,
    });
  }
}
