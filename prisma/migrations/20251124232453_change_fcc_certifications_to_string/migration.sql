/*
  Warnings:

  - You are about to drop the column `isAdminApproved` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "refresh_token_expires_in" INTEGER;

-- AlterTable
ALTER TABLE "Classroom" ALTER COLUMN "fccCertifications" SET DATA TYPE TEXT[];

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isAdminApproved";
