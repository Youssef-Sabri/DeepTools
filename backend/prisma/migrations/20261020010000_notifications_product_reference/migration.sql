ALTER TABLE "notifications" ADD CONSTRAINT "notifications_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
