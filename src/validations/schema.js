import { z } from 'zod';

export const signupValidationSchema = z.object({
    username: z.string().trim().lowercase().min(4),
    email: z.email(),
    password: z.string().min(6)
});

export const loginValidationSchema = z.object({
    email: z.email(),
    password: z.string().min(6)
});

export const forgotPasswordValidationSchema = z.object({
    email: z.email()
})