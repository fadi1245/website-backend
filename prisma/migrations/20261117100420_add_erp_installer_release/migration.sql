/*
  Warnings:

  - You are about to drop the `product_releases` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "product_releases";

-- CreateTable
CREATE TABLE "erp_installer_releases" (
    "id" UUID NOT NULL,
    "version" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "checksum_sha256" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "erp_installer_releases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "erp_installer_releases_uploaded_at_id_idx" ON "erp_installer_releases"("uploaded_at" DESC, "id" DESC);
