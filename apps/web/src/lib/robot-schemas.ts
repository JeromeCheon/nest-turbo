import { z } from 'zod';

export const registerRobotSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.'),
  model: z.string().min(1, '모델명을 입력해주세요.'),
});

export type RegisterRobotInput = z.infer<typeof registerRobotSchema>;
