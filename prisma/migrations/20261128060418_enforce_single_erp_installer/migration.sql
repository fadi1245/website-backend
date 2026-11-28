/*
  Warnings:

  - You are about to drop the column `is_active` on the `erp_installer_releases` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "erp_installer_releases" DROP COLUMN "is_active";
CREATE UNIQUE INDEX "erp_installer_only_one_record_idx"
ON "erp_installer_releases" ((1));
