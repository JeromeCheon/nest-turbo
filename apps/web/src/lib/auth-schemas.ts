import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('올바른 이메일 형식으로 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.email('올바른 이메일 형식으로 입력해주세요.'),
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
    passwordConfirm: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
