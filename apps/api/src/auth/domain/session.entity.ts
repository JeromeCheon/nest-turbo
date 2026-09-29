import { InvalidRefreshSessionError } from './auth.exceptions';

export class Session {
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly refreshTokenHash: string,
    readonly userAgent: string | null,
    readonly expiresAt: Date,
    readonly createdAt: Date,
    public revokedAt: Date | null,
  ) {}

  static issue(input: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent?: string | null;
  }): Session {
    return new Session(
      '',
      input.userId,
      input.refreshTokenHash,
      input.userAgent ?? null,
      input.expiresAt,
      new Date(),
      null,
    );
  }

  static restore(props: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    userAgent: string | null;
    expiresAt: Date;
    createdAt: Date;
    revokedAt: Date | null;
  }): Session {
    return new Session(
      props.id,
      props.userId,
      props.refreshTokenHash,
      props.userAgent,
      props.expiresAt,
      props.createdAt,
      props.revokedAt,
    );
  }

  isActive(now: Date = new Date()): boolean {
    return this.revokedAt === null && this.expiresAt.getTime() > now.getTime();
  }

  revoke(at: Date = new Date()): void {
    if (this.revokedAt === null) {
      this.revokedAt = at;
    }
  }

  rotate(
    refreshTokenHash: string,
    expiresAt: Date,
    now: Date = new Date(),
  ): Session {
    if (!this.isActive(now)) {
      throw new InvalidRefreshSessionError();
    }

    this.revoke(now);

    return Session.issue({
      userId: this.userId,
      refreshTokenHash,
      expiresAt,
      userAgent: this.userAgent,
    });
  }
}
