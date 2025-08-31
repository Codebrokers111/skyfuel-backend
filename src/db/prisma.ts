import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

prisma.$connect().catch((e) => {
  console.error("Prisma connect error:", e);
  process.exit(1);
});
