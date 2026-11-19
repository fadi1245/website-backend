/*
  Warnings:

  - A unique constraint covering the columns `[file_key]` on the table `erp_installer_releases` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "erp_installer_releases_file_key_key" ON "erp_installer_releases"("file_key");
