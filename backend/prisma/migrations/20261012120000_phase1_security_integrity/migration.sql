-- Additive migration. Existing orders, licenses, and files remain in place.
ALTER TABLE "users" ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "products"
  ADD COLUMN "approved_file_key" TEXT,
  ADD COLUMN "approved_file_mime" VARCHAR(100);

UPDATE "products"
SET "approved_file_key" = "file_key", "approved_file_mime" = "file_mime"
WHERE "status" = 'APPROVED' AND "file_key" IS NOT NULL;

ALTER TABLE "licenses"
  ADD COLUMN "file_key" TEXT,
  ADD COLUMN "file_mime" VARCHAR(100);

UPDATE "licenses" AS l
SET "file_key" = p."approved_file_key", "file_mime" = p."approved_file_mime"
FROM "products" AS p
WHERE l."product_id" = p."id";

ALTER TABLE "orders"
  ADD COLUMN "seller_id" UUID,
  ADD COLUMN "product_name" TEXT,
  ADD COLUMN "file_key" TEXT,
  ADD COLUMN "file_mime" VARCHAR(100),
  ADD COLUMN "pending_key" TEXT,
  ADD COLUMN "currency" VARCHAR(3) NOT NULL DEFAULT 'USD';

UPDATE "orders" AS o
SET "seller_id" = p."seller_id", "product_name" = p."name", "file_key" = p."approved_file_key", "file_mime" = p."approved_file_mime"
FROM "products" AS p
WHERE o."product_id" = p."id";

ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "orders" ALTER COLUMN "payment_gateway" SET DEFAULT 'unconfigured';
ALTER TABLE "orders" DROP CONSTRAINT "orders_product_id_fkey";
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "orders_seller_id_status_idx" ON "orders"("seller_id", "status");
CREATE UNIQUE INDEX "orders_pending_key_key" ON "orders"("pending_key");

CREATE TABLE "payment_events" (
  "id" UUID NOT NULL PRIMARY KEY,
  "gateway" VARCHAR(50) NOT NULL,
  "event_id" TEXT NOT NULL,
  "order_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "payment_events_gateway_event_id_key" ON "payment_events"("gateway", "event_id");
CREATE INDEX "payment_events_order_id_idx" ON "payment_events"("order_id");
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "rate_limit_buckets" (
  "key" VARCHAR(128) NOT NULL PRIMARY KEY,
  "hits" INTEGER NOT NULL,
  "reset_at" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "rate_limit_buckets_reset_at_idx" ON "rate_limit_buckets"("reset_at");
