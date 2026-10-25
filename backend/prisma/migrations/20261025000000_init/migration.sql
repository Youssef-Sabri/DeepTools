-- Enable pg_trgm extension for GIN trigram text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('UPLOAD', 'APPROVAL', 'REJECTION', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_ar" VARCHAR(100) NOT NULL,
    "name_ar_norm" TEXT,
    "description" TEXT,
    "description_ar" TEXT,
    "icon" VARCHAR(60),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "categories_display_order_check" CHECK ("display_order" >= 0)
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "name_ar" VARCHAR(255) NOT NULL,
    "name_ar_norm" TEXT,
    "description" TEXT NOT NULL,
    "description_ar" TEXT NOT NULL,
    "description_ar_norm" TEXT,
    "category" VARCHAR(100) NOT NULL,
    "category_id" UUID NOT NULL,
    "price" INTEGER NOT NULL,
    "badge" VARCHAR(50),
    "badge_ar" VARCHAR(50),
    "version" VARCHAR(20) NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_size" INTEGER,
    "file_mime" VARCHAR(100),
    "file_hash" VARCHAR(64),
    "file_extension" VARCHAR(20),
    "seller_id" UUID NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_note" TEXT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licenses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "license_key" TEXT NOT NULL,
    "file_key" TEXT,
    "file_mime" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "product_id" UUID,
    "seller_id" UUID,
    "product_name" TEXT,
    "file_key" TEXT,
    "file_mime" VARCHAR(100),
    "pending_key" TEXT,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "amount" INTEGER NOT NULL,
    "commission_percent" INTEGER NOT NULL DEFAULT 10,
    "commission_amount" INTEGER NOT NULL DEFAULT 0,
    "seller_amount" INTEGER NOT NULL DEFAULT 0,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "payment_gateway" VARCHAR(50) NOT NULL DEFAULT 'unconfigured',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "id" UUID NOT NULL,
    "gateway" VARCHAR(50) NOT NULL,
    "event_id" TEXT NOT NULL,
    "order_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_buckets" (
    "key" VARCHAR(128) NOT NULL,
    "hits" INTEGER NOT NULL,
    "reset_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "title_ar" VARCHAR(160) NOT NULL,
    "message" TEXT NOT NULL,
    "message_ar" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "product_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_name_trgm_idx" ON "users" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "users_email_trgm_idx" ON "users" USING GIN ("email" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_is_active_display_order_idx" ON "categories"("is_active", "display_order");

-- CreateIndex
CREATE INDEX "categories_name_trgm_idx" ON "categories" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "categories_name_ar_trgm_idx" ON "categories" USING GIN ("name_ar" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "categories_name_ar_norm_trgm_idx" ON "categories" USING GIN ("name_ar_norm" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "products_seller_id_idx" ON "products"("seller_id");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_deleted_at_status_created_at_idx" ON "products"("deleted_at", "status", "created_at");

-- CreateIndex
CREATE INDEX "products_seller_id_deleted_at_created_at_idx" ON "products"("seller_id", "deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "products_name_ar_trgm_idx" ON "products" USING GIN ("name_ar" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "products_name_ar_norm_trgm_idx" ON "products" USING GIN ("name_ar_norm" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "products_description_ar_norm_trgm_idx" ON "products" USING GIN ("description_ar_norm" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "products_description_trgm_idx" ON "products" USING GIN ("description" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "products_description_ar_trgm_idx" ON "products" USING GIN ("description_ar" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "licenses_license_key_key" ON "licenses"("license_key");

-- CreateIndex
CREATE INDEX "licenses_user_id_idx" ON "licenses"("user_id");

-- CreateIndex
CREATE INDEX "licenses_product_id_idx" ON "licenses"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "licenses_user_id_product_id_key" ON "licenses"("user_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_pending_key_key" ON "orders"("pending_key");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_product_id_idx" ON "orders"("product_id");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_seller_id_status_created_at_idx" ON "orders"("seller_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "payment_events_order_id_idx" ON "payment_events"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_gateway_event_id_key" ON "payment_events"("gateway", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX "rate_limit_buckets_reset_at_idx" ON "rate_limit_buckets"("reset_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_id_idx" ON "notifications"("user_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_product_id_idx" ON "notifications"("product_id");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Notification trigger function and trigger
CREATE OR REPLACE FUNCTION notify_product_review() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO "notifications" ("id", "user_id", "title", "title_ar", "message", "message_ar", "type", "product_id")
    SELECT gen_random_uuid(), id, 'Asset awaiting review', 'أداة بانتظار المراجعة', 'A new asset was submitted: ' || NEW.name, 'تم تقديم أداة جديدة: ' || COALESCE(NULLIF(NEW.name_ar, ''), NEW.name), 'UPLOAD', NEW.id
    FROM "users"
    WHERE role = 'ADMIN' AND deleted_at IS NULL;
  ELSIF NEW.status = 'PENDING' AND OLD.status <> 'PENDING' THEN
    INSERT INTO "notifications" ("id", "user_id", "title", "title_ar", "message", "message_ar", "type", "product_id")
    SELECT gen_random_uuid(), id, 'Asset awaiting review', 'أداة بانتظار المراجعة', 'An asset was resubmitted: ' || NEW.name, 'أعيد تقديم الأداة: ' || COALESCE(NULLIF(NEW.name_ar, ''), NEW.name), 'UPLOAD', NEW.id
    FROM "users"
    WHERE role = 'ADMIN' AND deleted_at IS NULL;
  ELSIF NEW.status = 'APPROVED' AND OLD.status <> 'APPROVED' THEN
    INSERT INTO "notifications" ("id", "user_id", "title", "title_ar", "message", "message_ar", "type", "product_id")
    VALUES (gen_random_uuid(), NEW.seller_id, 'Asset approved', 'تم قبول الأداة', 'Your asset was approved: ' || NEW.name, 'تم قبول أداتك: ' || COALESCE(NULLIF(NEW.name_ar, ''), NEW.name), 'APPROVAL', NEW.id);
  ELSIF NEW.status = 'REJECTED' AND OLD.status <> 'REJECTED' THEN
    INSERT INTO "notifications" ("id", "user_id", "title", "title_ar", "message", "message_ar", "type", "product_id")
    VALUES (gen_random_uuid(), NEW.seller_id, 'Asset rejected', 'تم رفض الأداة', 'Your asset was rejected: ' || NEW.name, 'تم رفض أداتك: ' || COALESCE(NULLIF(NEW.name_ar, ''), NEW.name), 'REJECTION', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_review_notifications ON "products";
CREATE TRIGGER product_review_notifications
AFTER INSERT OR UPDATE OF status ON "products"
FOR EACH ROW EXECUTE FUNCTION notify_product_review();
