import { z } from "zod";

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

export const gloginSchema = z.object({
  email: z.string().email("Valid email required"),
});

export const existUserSchema = z.object({
  email: z.string().email("Valid email required"),
});

export const updatePassSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  npass: z.string().min(8, "New password must be at least 8 characters"),
});

export type UpdatePassInput = z.infer<typeof updatePassSchema>;
export type ExistUserInput = z.infer<typeof existUserSchema>;
export type GLoginInput = z.infer<typeof gloginSchema>;
export type CaptchaInput = z.infer<typeof captchaSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
