import type { RobotEventDto, RobotPart } from '@repo/api';

export type RobotEventSource = 'web' | 'system';

export class RobotEvent {
  private constructor(
    readonly id: string,
    readonly robotId: string,
    readonly part: RobotPart,
    readonly source: RobotEventSource,
    readonly payload: Record<string, unknown>,
    readonly createdAt: Date,
  ) {}

  static record(input: {
    robotId: string;
    part: RobotPart;
    source: RobotEventSource;
    payload: Record<string, unknown>;
  }): RobotEvent {
    return new RobotEvent(
      '',
      input.robotId,
      input.part,
      input.source,
      input.payload,
      new Date(),
    );
  }

  static restore(props: {
    id: string;
    robotId: string;
    part: RobotPart;
    source: RobotEventSource;
    payload: Record<string, unknown>;
    createdAt: Date;
  }): RobotEvent {
    return new RobotEvent(
      props.id,
      props.robotId,
      props.part,
      props.source,
      props.payload,
      props.createdAt,
    );
  }

  toDto(): RobotEventDto {
    return {
      id: this.id,
      robotId: this.robotId,
      part: this.part,
      source: this.source,
      payload: this.payload,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
