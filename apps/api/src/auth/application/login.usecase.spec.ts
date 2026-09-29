import { InvalidCredentialsError } from '../domain/auth.exceptions';
import { Email } from '../domain/email.vo';
import { PasswordHash } from '../domain/password-hash.vo';
import { PasswordHasher } from '../domain/password-hasher';
import { Session } from '../domain/session.entity';
import { SessionRepository } from '../domain/session.repository';
import { TokenService } from '../domain/token.service';
import { User } from '../domain/user.entity';
import { UserRepository } from '../domain/user.repository';
import { LoginUseCase } from './login.usecase';

const existingUser = User.restore({
  id: 'user-1',
  email: Email.create('pilot@example.com'),
  passwordHash: PasswordHash.create('$2b$10$abcdefghijklmnopqrstuv'),
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
});

function build(options: { found: User | null; matches?: boolean }) {
  const users = {
    findByEmail: jest.fn().mockResolvedValue(options.found),
    findById: jest.fn(),
    create: jest.fn(),
  } as unknown as UserRepository;

  const sessions = {
    create: jest.fn((session: Session) => Promise.resolve(session)),
    findByRefreshTokenHash: jest.fn(),
    save: jest.fn(),
  } as unknown as SessionRepository;

  const hasher = {
    hash: jest.fn(),
    compare: jest.fn().mockResolvedValue(options.matches ?? false),
  } as unknown as PasswordHasher;

  const tokens = {
    issueAccessToken: jest.fn().mockReturnValue('access-jwt'),
    issueRefreshToken: jest.fn().mockReturnValue({
      token: 'refresh-raw',
      hash: 'refresh-hash',
      expiresAt: new Date('2026-01-08T00:00:00.000Z'),
    }),
    hashRefreshToken: jest.fn(),
  } as unknown as TokenService;

  return {
    useCase: new LoginUseCase(users, sessions, hasher, tokens),
    sessions,
  };
}

describe(LoginUseCase.name, () => {
  it('가입되지 않은 이메일이면 InvalidCredentials', async () => {
    const { useCase } = build({ found: null });

    await expect(
      useCase.execute({ email: 'nobody@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('비밀번호가 틀리면 같은 InvalidCredentials', async () => {
    const { useCase } = build({ found: existingUser, matches: false });

    await expect(
      useCase.execute({
        email: 'pilot@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('성공하면 Session을 저장하고 토큰을 돌려준다', async () => {
    const { useCase, sessions } = build({
      found: existingUser,
      matches: true,
    });

    const result = await useCase.execute(
      { email: 'pilot@example.com', password: 'password123' },
      'jest-agent',
    );

    expect(result.accessToken).toBe('access-jwt');
    expect(result.refresh.token).toBe('refresh-raw');
    expect(result.user).toEqual({
      id: 'user-1',
      email: 'pilot@example.com',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    const saved = (sessions.create as jest.Mock).mock.calls[0][0] as Session;

    expect(saved.userId).toBe('user-1');
    expect(saved.refreshTokenHash).toBe('refresh-hash');
    expect(saved.userAgent).toBe('jest-agent');
    expect(saved.isActive(new Date('2026-01-02T00:00:00.000Z'))).toBe(true);
  });
});
