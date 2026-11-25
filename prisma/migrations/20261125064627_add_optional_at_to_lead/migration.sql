/*
  Warnings:

  - Made the column `service` on table `leads` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "leads" ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "service" SET NOT NULL,
ALTER COLUMN "message" DROP NOT NULL;
