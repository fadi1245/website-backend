/*
  Warnings:

  - Added the required column `updated_at` to the `leads` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "updated_at" TIMESTAMPTZ(3) NOT NULL;
