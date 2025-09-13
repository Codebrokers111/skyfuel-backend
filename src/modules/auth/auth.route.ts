import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { sha256Hex } from "./auth.service.js";
import { redisClient } from "../../db/redis.js";
import {
  signup,
  signin,
  getUser,
  verifyCaptcha,
  glogin,
  existUser,
  updatePassword,
} from "./auth.service.js";
import {
  signupSchema,
  signinSchema,
  captchaSchema,
  gloginSchema,
  existUserSchema,
  updatePassSchema,
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
  const result = await existUser(body);
  res.json({
    success: result.exists,
    ...(result.exists ? { id: result.id, name: result.name } : {}),
    msg: result.msg,
  });
});

// Update password for forgotten password
authRouter.put("/updatepass", async (req: Request, res: Response) => {
  try {
    // validate body
    const body = parse<{ uid: String; npass: string }>(
      updatePassSchema,
      req.body,
      res
    );
    if (!body) return;
    const authHeader = (req.headers.authorization || "") as string;
    const tokenPlain = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : (req.cookies?.reset as string | undefined) || null;

    if (!tokenPlain) {
      return res
        .status(401)
        .json({ success: false, message: "No reset token provided" });
    }
    const tokenHash = sha256Hex(tokenPlain);
    const resetKey = `reset:${tokenHash}`;
    const resetToeken = await redisClient.get(resetKey);
    if (resetToeken) {
      await redisClient.del(resetKey);
    }
    const { userId, npass } = req.body as { userId?: string; npass?: string };
    if (!npass) {
      return res
        .status(400)
        .json({ success: false, message: "New password required" });
    }
    const result = await updatePassword(userId, body.npass);
    if (!result.ok) {
      // unlikely here because updatePassword always returns ok in this implementation
      return res.status(500).json({ error: "Failed to update password" });
    }
    return res.json({ success: true, user: result.user });
  } catch (error) {
    console.error("Unhandled error in /updatepass:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});
