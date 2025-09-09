import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import {
  signup,
  signin,
  getUser,
  verifyCaptcha,
  glogin,
  existUser,
} from "./auth.service.js";
import {
  signupSchema,
  signinSchema,
  captchaSchema,
  gloginSchema,
  existUserSchema,
} from "./auth.validator.js";
import { authenticate } from "./auth.middleware.js";

export const authRouter = Router();

interface AuthRequest extends Request {
  userId?: string;
}

// small helper to parse Zod
function parse<T>(
  schema: { safeParse: (x: unknown) => any },
  data: unknown,
  res: Response
): T | undefined {
  const r = schema.safeParse(data);
  if (!r.success) {
    res.status(400).json({
      error: "Validation failed",
      details: r.error.flatten(),
    });
    return;
  }
  return r.data as T;
}

authRouter.post(
  "/signup",
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

    res
      .status(201)
      .json({ success: true, user: result.user, access: result.access });
  }
);

authRouter.post(
  "/signin",
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

    res.json({ success: true, user: result.user, access: result.access });
  }
);

authRouter.get(
  "/getuser",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    const result = await getUser(req.userId!);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }
    res.json({ user: result.user });
  }
);

authRouter.post("/checkcaptcha", async (req: Request, res: Response) => {
  const body = parse<{ token: string }>(captchaSchema, req.body, res);
  if (!body) return;

  const result = await verifyCaptcha(body.token);
  if (!result.ok) {
    return res.status(result.status).json({ stat: false, msg: result.error });
  }

  res.status(200).json({ stat: true, msg: result.msg });
});

authRouter.post("/glogin", async (req: Request, res: Response) => {
  const body = parse<{ email: string }>(gloginSchema, req.body, res);
  if (!body) return;

  const result = await glogin(body);
  if (!result.ok) {
    return res
      .status(result.status)
      .json({ success: false, error: result.error });
  }

  res.json({
    success: true,
    access: result.access,
    user: result.user,
  });
});

// Check if user exists
authRouter.post("/existuser", async (req: Request, res: Response) => {
  const body = parse<{ email: string }>(existUserSchema, req.body, res);
  if (!body) return;
  console.log("inside exist user api");
  const result = await existUser(body);

  res.json({
    success: result.exists,
    ...(result.exists ? { id: result.id, name: result.name } : {}),
    msg: result.msg,
  });
});
