import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { signup, signin } from './auth.service.js';
import { signupSchema, signinSchema } from './auth.validator.js';

export const authRouter = Router();

// small helper to parse Zod
function parse<T>(
    schema: { safeParse: (x: unknown) => any },
    data: unknown,
    res: Response
): T | undefined {
    const r = schema.safeParse(data);
    if (!r.success) {
        res.status(400).json({
            error: 'Validation failed',
            details: r.error.flatten(),
        });
        return;
    }
    return r.data as T;
}

authRouter.post(
    '/signup',
    async (req: Request, res: Response, _next: NextFunction) => {
        const body = parse<{ email: string; password: string; name?: string }>(
            signupSchema,
            req.body,
            res
        );
        if (!body) return;

        const result = await signup(body);
        if (!result.ok)
            return res.status(result.status).json({ error: result.error });

        res.status(201).json({ user: result.user, access: result.access });
    }
);

authRouter.post(
    '/signin',
    async (req: Request, res: Response, _next: NextFunction) => {
        const body = parse<{ email: string; password: string }>(
            signinSchema,
            req.body,
            res
        );
        if (!body) return;

        const result = await signin(body);
        if (!result.ok)
            return res.status(result.status).json({ error: result.error });

        res.json({ user: result.user, access: result.access });
    }
);
