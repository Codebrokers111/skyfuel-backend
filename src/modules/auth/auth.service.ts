import { prisma } from "../../db/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
const CAPTCHA_SEC_KEY = process.env.C_SECRET_KEY;
const CAPTCHA_VERIFY = process.env.C_VERIFY;

export type PublicUser = {
  id: string;
  email: string;
  name?: string;
  emailVerifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toPublicUser(u: any): PublicUser {
  const { id, email, name, emailVerifiedAt, createdAt, updatedAt } = u;
  return { id, email, name, emailVerifiedAt, createdAt, updatedAt };
}

// Helper to hash input using SHA-256 and return hex string
export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function signup(input: {
  email: string;
  password: string;
  name?: string;
}) {
  try {
    const email = input.email.toLowerCase().trim();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return {
        ok: false,
        status: 409,
        error: "Email already registered",
      } as const;
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name: input.name ?? null,
        passwordHash,
        provider: "LOCAL",
      },
    });

    const access = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "15m",
    });
    return { ok: true, user: toPublicUser(user), access } as const;
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error: "Some error occurred verifying captcha",
    } as const;
  }
}

export async function signin(input: { email: string; password: string }) {
  const email = input.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return { ok: false, status: 401, error: "Invalid credentials" } as const;
  }
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    return { ok: false, status: 401, error: "Invalid credentials" } as const;
  }

  const access = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });
  return { ok: true, user: toPublicUser(user), access } as const;
}
// Fetch user details by user ID
export async function getUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { ok: false, status: 404, error: "User not found" } as const;
  }
  return { ok: true, user: toPublicUser(user) } as const;
}

export async function verifyCaptcha(token: string) {
  try {
    const resp = await fetch(
      `${CAPTCHA_VERIFY}?secret=${CAPTCHA_SEC_KEY}&response=${token}`,
      { method: "POST" }
    );
    const data = await resp.json();

    if (data.success) {
      return { ok: true, msg: "Captcha verified successfully" } as const;
    } else {
      return {
        ok: false,
        status: 400,
        error: "Not a Human, error verifying Captcha",
      } as const;
    }
  } catch (err) {
    return {
      ok: false,
      status: 500,
      error: "Some error occurred verifying captcha",
    } as const;
  }
}

export async function glogin(input: { email: string }) {
  try {
    const email = input.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return {
        ok: false,
        status: 400,
        error: "Email not found, kindly signup",
      } as const;
    }

    const access = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "15m",
    });

    return { ok: true, user: toPublicUser(user), access } as const;
  } catch (error) {
    return { ok: false, status: 500, error: "Internal server error" } as const;
  }
}

// Check if a user exists by email
export async function existUser(input: { email: string }) {
  try {
    const email = input.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      return {
        ok: true,
        exists: true,
        id: user.id,
        name: user.name,
        msg: "Email Already Exist",
      } as const;
    }

    return {
      ok: true,
      exists: false,
      msg: "Email Not Found",
    } as const;
  } catch (error) {
    return {
      ok: false,
      exists: false,
      status: 500,
      msg: "Internal server error",
    } as const;
  }
}

// Update user password
export async function updatePassword(userId: string, newPassword: string) {
  // hash the new password
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // update user in prisma
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, passwordChangedAt: new Date() },
  });

  return { ok: true, user: toPublicUser(updated) } as const;
}
