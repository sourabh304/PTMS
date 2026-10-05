import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean(),
});
export type LoginValues = z.infer<typeof loginSchema>;

/** Mirrors the API password policy (the API validates again). */
export const passwordSchema = (minLength: number) =>
  z
    .string()
    .min(minLength, `Use at least ${minLength} characters`)
    .regex(/[a-z]/, 'Include a lower-case letter')
    .regex(/[A-Z]/, 'Include an upper-case letter')
    .regex(/\d/, 'Include a number');
