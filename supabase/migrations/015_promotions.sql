-- ============================================================
-- 015: Promotions – Coupons & Event Banners
-- ============================================================

-- 1. Coupons table
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  min_order_amount INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (franchise_id, code)
);

CREATE TRIGGER set_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_coupons_franchise ON coupons(franchise_id);
CREATE INDEX idx_coupons_store ON coupons(store_id);
CREATE INDEX idx_coupons_code ON coupons(franchise_id, code);

-- 2. Coupon usages table
CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  discount_amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);

CREATE INDEX idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_order ON coupon_usages(order_id);

-- 3. Event banners table
CREATE TABLE IF NOT EXISTS event_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  link_type TEXT CHECK (link_type IN ('menu', 'coupon', 'external')),
  link_value TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_event_banners_updated_at
  BEFORE UPDATE ON event_banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_event_banners_franchise ON event_banners(franchise_id);
CREATE INDEX idx_event_banners_store ON event_banners(store_id);

-- 4. Alter orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0;

-- 5. RPC: apply_coupon
CREATE OR REPLACE FUNCTION apply_coupon(
  p_coupon_id UUID,
  p_order_id UUID,
  p_store_id UUID,
  p_discount_amount INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
BEGIN
  -- Lock the coupon row
  SELECT * INTO v_coupon FROM coupons WHERE id = p_coupon_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'COUPON_NOT_FOUND';
  END IF;

  IF NOT v_coupon.is_active THEN
    RAISE EXCEPTION 'COUPON_INACTIVE';
  END IF;

  IF v_coupon.starts_at > now() THEN
    RAISE EXCEPTION 'COUPON_NOT_STARTED';
  END IF;

  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
    RAISE EXCEPTION 'COUPON_EXPIRED';
  END IF;

  IF v_coupon.max_uses IS NOT NULL AND v_coupon.current_uses >= v_coupon.max_uses THEN
    RAISE EXCEPTION 'COUPON_MAX_USES_REACHED';
  END IF;

  -- Increment usage
  UPDATE coupons SET current_uses = current_uses + 1 WHERE id = p_coupon_id;

  -- Record usage
  INSERT INTO coupon_usages (coupon_id, order_id, store_id, discount_amount)
  VALUES (p_coupon_id, p_order_id, p_store_id, p_discount_amount);

  -- Update order
  UPDATE orders SET coupon_id = p_coupon_id, discount_amount = p_discount_amount
  WHERE id = p_order_id;
END;
$$;

-- 6. RLS – coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupons_select" ON coupons
  FOR SELECT USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() IN ('brand_admin', 'store_admin') AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "coupons_insert" ON coupons
  FOR INSERT WITH CHECK (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "coupons_update" ON coupons
  FOR UPDATE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "coupons_delete" ON coupons
  FOR DELETE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "coupons_anon_select" ON coupons
  FOR SELECT TO anon USING (is_active = TRUE);

-- 7. RLS – coupon_usages
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coupon_usages_select" ON coupon_usages
  FOR SELECT USING (
    get_my_role() IN ('system_admin', 'brand_admin', 'store_admin')
  );

CREATE POLICY "coupon_usages_anon_insert" ON coupon_usages
  FOR INSERT TO anon WITH CHECK (TRUE);

CREATE POLICY "coupon_usages_anon_select" ON coupon_usages
  FOR SELECT TO anon USING (TRUE);

-- 8. RLS – event_banners
ALTER TABLE event_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_banners_select" ON event_banners
  FOR SELECT USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() IN ('brand_admin', 'store_admin') AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "event_banners_insert" ON event_banners
  FOR INSERT WITH CHECK (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "event_banners_update" ON event_banners
  FOR UPDATE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "event_banners_delete" ON event_banners
  FOR DELETE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "event_banners_anon_select" ON event_banners
  FOR SELECT TO anon USING (is_active = TRUE);

-- 9. Storage bucket for event banners
INSERT INTO storage.buckets (id, name, public) VALUES ('event-banners', 'event-banners', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "event_banners_storage_select" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'event-banners');

CREATE POLICY "event_banners_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-banners'
    AND (SELECT get_my_role()) IN ('system_admin', 'brand_admin')
  );

CREATE POLICY "event_banners_storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'event-banners'
    AND (SELECT get_my_role()) IN ('system_admin', 'brand_admin')
  );
