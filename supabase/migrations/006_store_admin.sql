-- ============================================================
-- 006: Store Admin - Orders, Local Menus, Menu Overrides
-- ============================================================

-- ── Orders ──
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'preparing', 'completed', 'cancelled')),
  total_amount INTEGER NOT NULL DEFAULT 0,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Order Items ──
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_type TEXT NOT NULL DEFAULT 'master' CHECK (menu_type IN ('master', 'local')),
  menu_id UUID NOT NULL,
  menu_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL DEFAULT 0,
  total_price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Local Menus (store-level custom menus) ──
CREATE TABLE IF NOT EXISTS local_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_local_menus_updated_at
  BEFORE UPDATE ON local_menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Store Menu Overrides (sold-out / hidden for master menus) ──
CREATE TABLE IF NOT EXISTS store_menu_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  master_menu_id UUID NOT NULL REFERENCES master_menus(id) ON DELETE CASCADE,
  is_sold_out BOOLEAN NOT NULL DEFAULT FALSE,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, master_menu_id)
);

CREATE TRIGGER set_store_menu_overrides_updated_at
  BEFORE UPDATE ON store_menu_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_menu_overrides ENABLE ROW LEVEL SECURITY;

-- ── Orders ──
CREATE POLICY "orders_select" ON orders
  FOR SELECT USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND store_id IN (
      SELECT id FROM stores WHERE franchise_id = get_my_franchise_id()
    ))
    OR (get_my_role() = 'store_admin' AND store_id = get_my_store_id())
  );

CREATE POLICY "orders_insert" ON orders
  FOR INSERT WITH CHECK (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'store_admin' AND store_id = get_my_store_id())
    OR TRUE -- customers can create orders (unauthenticated via anon key)
  );

CREATE POLICY "orders_update" ON orders
  FOR UPDATE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'store_admin' AND store_id = get_my_store_id())
  );

-- ── Order Items ──
CREATE POLICY "order_items_select" ON order_items
  FOR SELECT USING (
    get_my_role() = 'system_admin'
    OR order_id IN (SELECT id FROM orders WHERE
      (get_my_role() = 'brand_admin' AND store_id IN (
        SELECT id FROM stores WHERE franchise_id = get_my_franchise_id()
      ))
      OR (get_my_role() = 'store_admin' AND store_id = get_my_store_id())
    )
    OR TRUE -- customers can read their order items
  );

CREATE POLICY "order_items_insert" ON order_items
  FOR INSERT WITH CHECK (TRUE); -- via order creation

-- ── Local Menus ──
CREATE POLICY "local_menus_select" ON local_menus
  FOR SELECT USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND store_id IN (
      SELECT id FROM stores WHERE franchise_id = get_my_franchise_id()
    ))
    OR (get_my_role() = 'store_admin' AND store_id = get_my_store_id())
    OR TRUE -- customers can view menus
  );

CREATE POLICY "local_menus_insert" ON local_menus
  FOR INSERT WITH CHECK (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'store_admin' AND store_id = get_my_store_id())
  );

CREATE POLICY "local_menus_update" ON local_menus
  FOR UPDATE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'store_admin' AND store_id = get_my_store_id())
  );

CREATE POLICY "local_menus_delete" ON local_menus
  FOR DELETE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'store_admin' AND store_id = get_my_store_id())
  );

-- ── Store Menu Overrides ──
CREATE POLICY "store_menu_overrides_select" ON store_menu_overrides
  FOR SELECT USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND store_id IN (
      SELECT id FROM stores WHERE franchise_id = get_my_franchise_id()
    ))
    OR (get_my_role() = 'store_admin' AND store_id = get_my_store_id())
    OR TRUE -- customers need to see sold-out status
  );

CREATE POLICY "store_menu_overrides_insert" ON store_menu_overrides
  FOR INSERT WITH CHECK (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'store_admin' AND store_id = get_my_store_id())
  );

CREATE POLICY "store_menu_overrides_update" ON store_menu_overrides
  FOR UPDATE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'store_admin' AND store_id = get_my_store_id())
  );

CREATE POLICY "store_menu_overrides_delete" ON store_menu_overrides
  FOR DELETE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'store_admin' AND store_id = get_my_store_id())
  );

-- ── Indexes for performance ──
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_local_menus_store_id ON local_menus(store_id);
CREATE INDEX IF NOT EXISTS idx_store_menu_overrides_store_id ON store_menu_overrides(store_id);
