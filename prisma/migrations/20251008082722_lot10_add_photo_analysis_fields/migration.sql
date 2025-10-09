/*
  Warnings:

  - Added the required column `updatedAt` to the `Photo` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PhotoStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'ERROR');

-- AlterTable
ALTER TABLE "Photo" ADD COLUMN     "errorCode" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "status" "PhotoStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Photo_status_idx" ON "Photo"("status");
