import { z } from 'zod';

import { UserEntitySchema } from '@/core/user/entity/user';

const Schema = UserEntitySchema.pick({
  clientId: true,
  clientSecret: true,
  organization: true,
  roles: true
});

export type AuthInput = z.infer<typeof Schema>;

export type AuthOutput = {
  token: string;
};
