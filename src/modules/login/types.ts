import { z } from 'zod';

import { UserEntitySchema } from '@/core/user/entity/user';

export const LoginSchema = UserEntitySchema.pick({
  login: true,
  password: true
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type LoginOutput = Promise<{ token: string }>;
