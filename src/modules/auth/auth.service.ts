import { prisma } from '../../db/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

export async function signup(input: { email: string; password: string; name?: string }) {
  const email = input.email.toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return { ok: false, status: 409, error: "Email already registered" } as const;
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: { email, name: input.name ?? null, passwordHash, provider: "LOCAL" }
  });

  const access = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, { expiresIn: "15m" });
  return { ok: true, user: toPublicUser(user), access } as const;
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

  const access = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, { expiresIn: "15m" });
  return { ok: true, user: toPublicUser(user), access } as const;
}
