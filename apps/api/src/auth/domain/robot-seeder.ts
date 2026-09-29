export abstract class RobotSeeder {
  abstract seedDefaults(ownerId: string): Promise<void>;
}
