import { InvalidRefreshSessionError } from './auth.exceptions';
import { Session } from './session.entity';

const HOUR = 60 * 60 * 1000;

function activeSession(): Session {
  return Session.issue({
    userId: 'user-1',
    refreshTokenHash: 'hash-1',
    expiresAt: new Date(Date.now() + HOUR),
    userAgent: 'jest',
  });
}

describe(Session.name, () => {
  it('발급 직후에는 활성 상태다', () => {
    expect(activeSession().isActive()).toBe(true);
  });

  it('만료 시각이 지나면 비활성이다', () => {
    const session = activeSession();

    expect(session.isActive(new Date(Date.now() + 2 * HOUR))).toBe(false);
  });

  it('revoke 후에는 비활성이다', () => {
    const session = activeSession();

    session.revoke();

    expect(session.isActive()).toBe(false);
    expect(session.revokedAt).toBeInstanceOf(Date);
  });

  it('revoke를 두 번 해도 최초 폐기 시각을 유지한다', () => {
    const session = activeSession();
    const first = new Date('2026-01-01T00:00:00.000Z');

    session.revoke(first);
    session.revoke(new Date('2026-02-02T00:00:00.000Z'));

    expect(session.revokedAt).toEqual(first);
  });

  it('rotate는 기존 세션을 revoke하고 같은 유저의 새 세션을 만든다', () => {
    const current = activeSession();
    const expiresAt = new Date(Date.now() + 7 * 24 * HOUR);

    const next = current.rotate('hash-2', expiresAt);

    expect(current.isActive()).toBe(false);
    expect(current.revokedAt).not.toBeNull();
    expect(next.id).toBe('');
    expect(next.userId).toBe(current.userId);
    expect(next.userAgent).toBe('jest');
    expect(next.refreshTokenHash).toBe('hash-2');
    expect(next.expiresAt).toEqual(expiresAt);
    expect(next.isActive()).toBe(true);
  });

  it('이미 revoke된 세션은 rotate할 수 없다', () => {
    const current = activeSession();
    current.revoke();

    expect(() => current.rotate('hash-2', new Date(Date.now() + HOUR))).toThrow(
      InvalidRefreshSessionError,
    );
  });

  it('만료된 세션은 rotate할 수 없다', () => {
    const current = activeSession();

    expect(() =>
      current.rotate(
        'hash-2',
        new Date(Date.now() + 2 * HOUR),
        new Date(Date.now() + 2 * HOUR),
      ),
    ).toThrow(InvalidRefreshSessionError);
  });
});
