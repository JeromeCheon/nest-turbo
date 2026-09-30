import type {
  RobotDto,
  RobotPart,
  RobotStatePayload,
  RobotStatus,
} from '@repo/api';

export class Robot {
  private constructor(
    readonly id: string,
    readonly ownerId: string,
    readonly name: string,
    readonly model: string,
    private currentStatus: RobotStatus,
    readonly createdAt: Date,
  ) {}

  static register(input: {
    ownerId: string;
    name: string;
    model: string;
  }): Robot {
    return new Robot(
      '',
      input.ownerId,
      input.name,
      input.model,
      'idle',
      new Date(),
    );
  }

  static restore(props: {
    id: string;
    ownerId: string;
    name: string;
    model: string;
    status: RobotStatus;
    createdAt: Date;
  }): Robot {
    return new Robot(
      props.id,
      props.ownerId,
      props.name,
      props.model,
      props.status,
      props.createdAt,
    );
  }

  get status(): RobotStatus {
    return this.currentStatus;
  }

  isOwnedBy(userId: string): boolean {
    return userId === this.ownerId;
  }

  applyCommand(part: RobotPart, now: Date = new Date()): RobotStatePayload {
    this.currentStatus = 'active';
    return {
      part,
      status: this.currentStatus,
      ts: now.getTime(),
    };
  }

  toDto(): RobotDto {
    return {
      id: this.id,
      name: this.name,
      model: this.model,
      status: this.currentStatus,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
