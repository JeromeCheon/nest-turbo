import { BcryptPasswordHasher } from './bcrypt-password-hasher';

describe(BcryptPasswordHasher.name, () => {
  const hasher = new BcryptPasswordHasher();

  it('해시는 평문과 다르고 bcrypt 포맷이다', async () => {
    const hashed = await hasher.hash('password123');

    expect(hashed).not.toBe('password123');
    expect(hashed.startsWith('$2')).toBe(true);
  });

  it('같은 평문이어도 salt 때문에 매번 다른 해시가 나온다', async () => {
    const first = await hasher.hash('password123');
    const second = await hasher.hash('password123');

    expect(first).not.toBe(second);
  });

  it('compare는 맞는 비밀번호만 통과시킨다', async () => {
    const hashed = await hasher.hash('password123');

    await expect(hasher.compare('password123', hashed)).resolves.toBe(true);
    await expect(hasher.compare('password124', hashed)).resolves.toBe(false);
  });
});
