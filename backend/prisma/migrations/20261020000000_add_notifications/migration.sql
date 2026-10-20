CREATE TYPE "NotificationType" AS ENUM ('UPLOAD', 'APPROVAL', 'REJECTION', 'SYSTEM');

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

CREATE INDEX "notifications_user_id_created_at_id_idx" ON "notifications"("user_id", "created_at" DESC, "id" DESC);
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Product writes and their notifications commit or roll back together.
CREATE FUNCTION notify_product_review() RETURNS trigger AS $$
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

CREATE TRIGGER product_review_notifications
AFTER INSERT OR UPDATE OF status ON "products"
FOR EACH ROW EXECUTE FUNCTION notify_product_review();
