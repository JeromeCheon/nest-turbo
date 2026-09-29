import { InvalidEmailError } from './auth.exceptions';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(readonly value: string) {}

  static create(value: string): Email {
    const normalized = value.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalized)) {
      throw new InvalidEmailError(value);
    }
    return new Email(normalized);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
