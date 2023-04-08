import { z } from 'zod';

export const LogoutSchema = z.object({ token: z.string().trim().min(10) });

export type LogoutInput = z.infer<typeof LogoutSchema>;
export type LogoutOutput = Promise<void>;
