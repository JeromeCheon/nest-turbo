import { Session } from './session.entity';

export abstract class SessionRepository {
  abstract create(session: Session): Promise<Session>;
  abstract findByRefreshTokenHash(hash: string): Promise<Session | null>;
  abstract save(session: Session): Promise<void>;
  abstract rotate(current: Session, next: Session): Promise<void>;
}
