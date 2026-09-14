export abstract class DomainException extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
