-- CreateEnum
CREATE TYPE "PushNotificationCategory" AS ENUM ('announcement', 'job_vacancy', 'product_update');

-- CreateEnum
CREATE TYPE "PushNotificationStatus" AS ENUM ('pending', 'sending', 'sent', 'failed');

-- CreateTable
CREATE TABLE "push_notifications" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "url" TEXT,
    "category" "PushNotificationCategory" NOT NULL,
    "status" "PushNotificationStatus" NOT NULL DEFAULT 'pending',
    "one_signal_id" TEXT,
    "sent_by_id" UUID,
    "sent_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "push_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_notifications_one_signal_id_key" ON "push_notifications"("one_signal_id");

-- CreateIndex
CREATE INDEX "push_notifications_created_at_id_idx" ON "push_notifications"("created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "push_notifications_status_created_at_idx" ON "push_notifications"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "push_notifications_sent_by_id_idx" ON "push_notifications"("sent_by_id");

-- AddForeignKey
ALTER TABLE "push_notifications" ADD CONSTRAINT "push_notifications_sent_by_id_fkey" FOREIGN KEY ("sent_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
