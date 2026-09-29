import { InvalidRefreshSessionError } from '../domain/auth.exceptions';
import { Email } from '../domain/email.vo';
import { PasswordHash } from '../domain/password-hash.vo';
import { Session } from '../domain/session.entity';
import { SessionRepository } from '../domain/session.repository';
import { TokenService } from '../domain/token.service';
import { User } from '../domain/user.entity';
import { UserRepository } from '../domain/user.repository';
import { RefreshSessionUseCase } from './refresh-session.usecase';

const HOUR = 60 * 60 * 1000;

const owner = User.restore({
  id: 'user-1',
  email: Email.create('pilot@example.com'),
  passwordHash: PasswordHash.create('$2b$10$abcdefghijklmnopqrstuv'),
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
});

function sessionRow(overrides: { expiresAt?: Date; revokedAt?: Date | null }) {
  return Session.restore({
    id: 'session-1',
    userId: 'user-1',
    refreshTokenHash: 'stored-hash',
    userAgent: 'jest',
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + HOUR),
    createdAt: new Date(Date.now() - HOUR),
    revokedAt: overrides.revokedAt ?? null,
  });
}

function build(found: Session | null, user: User | null = owner) {
  const users = {
    findByEmail: jest.fn(),
    findById: jest.fn().mockResolvedValue(user),
    create: jest.fn(),
  } as unknown as UserRepository;

  const sessions = {
    create: jest.fn(),
    findByRefreshTokenHash: jest.fn().mockResolvedValue(found),
    save: jest.fn(),
    rotate: jest.fn().mockResolvedValue(undefined),
  } as unknown as SessionRepository;

  const tokens = {
    issueAccessToken: jest.fn().mockReturnValue('new-access-jwt'),
    issueRefreshToken: jest.fn().mockReturnValue({
      token: 'next-raw',
      hash: 'next-hash',
      expiresAt: new Date(Date.now() + 7 * 24 * HOUR),
    }),
    hashRefreshToken: jest.fn().mockReturnValue('stored-hash'),
  } as unknown as TokenService;

  return {
    useCase: new RefreshSessionUseCase(users, sessions, tokens),
    sessions,
  };
}

describe(RefreshSessionUseCase.name, () => {
  it('쿠키가 없으면 거부한다', async () => {
    const { useCase } = build(null);

    await expect(useCase.execute(undefined)).rejects.toBeInstanceOf(
      InvalidRefreshSessionError,
    );
  });

  it('일치하는 세션이 없으면 거부한다', async () => {
    const { useCase } = build(null);

    await expect(useCase.execute('unknown-token')).rejects.toBeInstanceOf(
      InvalidRefreshSessionError,
    );
  });

  it('만료된 세션은 거부한다', async () => {
    const { useCase, sessions } = build(
      sessionRow({ expiresAt: new Date(Date.now() - HOUR) }),
    );

    await expect(useCase.execute('raw-token')).rejects.toBeInstanceOf(
      InvalidRefreshSessionError,
    );
    expect(sessions.rotate).not.toHaveBeenCalled();
  });

  it('revoke된 세션은 거부한다', async () => {
    const { useCase, sessions } = build(
      sessionRow({ revokedAt: new Date(Date.now() - HOUR) }),
    );

    await expect(useCase.execute('raw-token')).rejects.toBeInstanceOf(
      InvalidRefreshSessionError,
    );
    expect(sessions.rotate).not.toHaveBeenCalled();
  });

  it('성공하면 기존 세션을 revoke하고 새 세션을 만든다', async () => {
    const current = sessionRow({});
    const { useCase, sessions } = build(current);

    const result = await useCase.execute('raw-token');

    expect(current.revokedAt).toBeInstanceOf(Date);
    expect(sessions.rotate).toHaveBeenCalledTimes(1);

    const [saved, created] = (sessions.rotate as jest.Mock).mock
      .calls[0] as [Session, Session];

    expect(saved).toBe(current);
    expect(created.refreshTokenHash).toBe('next-hash');
    expect(created.userId).toBe('user-1');
    expect(result.accessToken).toBe('new-access-jwt');
    expect(result.refresh.token).toBe('next-raw');
  });
});
