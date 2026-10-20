-- Guest purchases were never account entitlements. Remove them, then require
-- every remaining order and license to belong to an authenticated user.
DROP INDEX IF EXISTS "licenses_buyer_email_product_active_key";
DROP INDEX IF EXISTS "licenses_user_product_active_key";
DROP INDEX IF EXISTS "licenses_buyer_email_idx";
DROP INDEX IF EXISTS "licenses_guest_access_token_key";
DROP INDEX IF EXISTS "orders_buyer_email_idx";
DROP INDEX IF EXISTS "guest_magic_link_tokens_token_hash_key";
DROP INDEX IF EXISTS "guest_magic_link_tokens_email_idx";

DELETE FROM "payment_events"
WHERE "order_id" IN (SELECT "id" FROM "orders" WHERE "user_id" IS NULL);
DELETE FROM "licenses" WHERE "user_id" IS NULL;
DELETE FROM "orders" WHERE "user_id" IS NULL;

ALTER TABLE "licenses" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "user_id" SET NOT NULL;
CREATE UNIQUE INDEX "licenses_user_id_product_id_key"
  ON "licenses"("user_id", "product_id");

ALTER TABLE "licenses"
  DROP COLUMN "buyer_email",
  DROP COLUMN "guest_access_token";
ALTER TABLE "orders"
  DROP COLUMN "buyer_email",
  DROP COLUMN "buyer_name";
DROP TABLE "guest_magic_link_tokens";

DROP INDEX IF EXISTS "orders_seller_id_status_idx";
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");
CREATE INDEX "products_deleted_at_status_created_at_idx"
  ON "products"("deleted_at", "status", "created_at");
CREATE INDEX "products_seller_id_deleted_at_created_at_idx"
  ON "products"("seller_id", "deleted_at", "created_at");
CREATE INDEX "orders_user_id_created_at_idx"
  ON "orders"("user_id", "created_at");
CREATE INDEX "orders_seller_id_status_created_at_idx"
  ON "orders"("seller_id", "status", "created_at");
