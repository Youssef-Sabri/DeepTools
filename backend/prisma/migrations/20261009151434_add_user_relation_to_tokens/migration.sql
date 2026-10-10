/*
  Warnings:

  - You are about to drop the column `email` on the `password_reset_tokens` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `password_reset_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "password_reset_tokens_email_idx";

-- AlterTable
ALTER TABLE "password_reset_tokens" DROP COLUMN "email",
ADD COLUMN     "user_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
