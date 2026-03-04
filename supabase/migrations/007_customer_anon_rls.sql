-- ============================================================
-- 007: Customer Anonymous RLS Policies
-- Allow anonymous (unauthenticated) users to read data needed
-- for the customer QR ordering flow.
-- ============================================================

-- ── Stores: customers need to read store info ──
CREATE POLICY "anon_stores_select" ON stores
  FOR SELECT USING (is_active = TRUE);

-- ── Menu Categories: customers need to see categories ──
CREATE POLICY "anon_menu_categories_select" ON menu_categories
  FOR SELECT USING (TRUE);

-- ── Master Menus: customers need to see menu items ──
CREATE POLICY "anon_master_menus_select" ON master_menus
  FOR SELECT USING (is_active = TRUE);

-- ── Orders: customers need to read their own order status ──
-- (order_items and orders INSERT already have OR TRUE)
CREATE POLICY "anon_orders_select" ON orders
  FOR SELECT USING (TRUE);
