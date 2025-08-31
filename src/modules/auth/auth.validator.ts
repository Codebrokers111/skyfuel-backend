import { z } from 'zod';

export const signupSchema = z.object({
    email: z.email(),
    password: z.string().min(8),
    name: z.string().min(1).optional(),
});

export const signinSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
});

export const captchaSchema = z.object({
  token: z.string().min(1, "Captcha token is required"),
});

export type CaptchaInput = z.infer<typeof captchaSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
