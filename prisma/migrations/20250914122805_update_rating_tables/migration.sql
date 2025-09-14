/*
  Warnings:

  - You are about to alter the column `value` on the `Rating` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(3,1)`.

*/
-- AlterTable
ALTER TABLE "public"."Rating" ALTER COLUMN "value" SET DATA TYPE DECIMAL(3,1);
