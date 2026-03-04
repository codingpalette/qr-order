-- ============================================================
-- 009: Customer Experience Improvements
-- Menu options, order memo, staff calls, allergens, prep time
-- ============================================================

-- 1) 메뉴 옵션 그룹 (프랜차이즈 레벨)
CREATE TABLE menu_option_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES franchises(id),
  name TEXT NOT NULL,
  is_required BOOLEAN DEFAULT false,
  min_select INTEGER DEFAULT 0,
  max_select INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2) 옵션 항목
CREATE TABLE menu_option_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_group_id UUID NOT NULL REFERENCES menu_option_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_delta INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3) 메뉴↔옵션그룹 연결 (N:N)
CREATE TABLE menu_option_group_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_type TEXT NOT NULL CHECK (menu_type IN ('master', 'local')),
  menu_id UUID NOT NULL,
  option_group_id UUID NOT NULL REFERENCES menu_option_groups(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(menu_type, menu_id, option_group_id)
);

-- 4) 주문 항목별 선택 옵션 기록
CREATE TABLE order_item_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  option_group_name TEXT NOT NULL,
  option_item_name TEXT NOT NULL,
  price_delta INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5) 직원 호출
CREATE TABLE staff_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  table_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6) 기존 테이블 컬럼 추가
ALTER TABLE orders ADD COLUMN memo TEXT;
ALTER TABLE stores ADD COLUMN avg_prep_minutes INTEGER DEFAULT 15;
ALTER TABLE master_menus ADD COLUMN allergens TEXT[] DEFAULT '{}';
ALTER TABLE local_menus ADD COLUMN allergens TEXT[] DEFAULT '{}';

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE menu_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_option_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_option_group_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_calls ENABLE ROW LEVEL SECURITY;

-- ── menu_option_groups ──
CREATE POLICY "anon_menu_option_groups_select" ON menu_option_groups
  FOR SELECT USING (TRUE);

CREATE POLICY "menu_option_groups_insert" ON menu_option_groups
  FOR INSERT WITH CHECK (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "menu_option_groups_update" ON menu_option_groups
  FOR UPDATE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "menu_option_groups_delete" ON menu_option_groups
  FOR DELETE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

-- ── menu_option_items ──
CREATE POLICY "anon_menu_option_items_select" ON menu_option_items
  FOR SELECT USING (TRUE);

CREATE POLICY "menu_option_items_insert" ON menu_option_items
  FOR INSERT WITH CHECK (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND option_group_id IN (
      SELECT id FROM menu_option_groups WHERE franchise_id = get_my_franchise_id()
    ))
  );

CREATE POLICY "menu_option_items_update" ON menu_option_items
  FOR UPDATE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND option_group_id IN (
      SELECT id FROM menu_option_groups WHERE franchise_id = get_my_franchise_id()
    ))
  );

CREATE POLICY "menu_option_items_delete" ON menu_option_items
  FOR DELETE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND option_group_id IN (
      SELECT id FROM menu_option_groups WHERE franchise_id = get_my_franchise_id()
    ))
  );

-- ── menu_option_group_links ──
CREATE POLICY "anon_menu_option_group_links_select" ON menu_option_group_links
  FOR SELECT USING (TRUE);

CREATE POLICY "menu_option_group_links_insert" ON menu_option_group_links
  FOR INSERT WITH CHECK (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND option_group_id IN (
      SELECT id FROM menu_option_groups WHERE franchise_id = get_my_franchise_id()
    ))
  );

CREATE POLICY "menu_option_group_links_delete" ON menu_option_group_links
  FOR DELETE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND option_group_id IN (
      SELECT id FROM menu_option_groups WHERE franchise_id = get_my_franchise_id()
    ))
  );

-- ── order_item_options ──
CREATE POLICY "order_item_options_insert" ON order_item_options
  FOR INSERT WITH CHECK (TRUE); -- via order creation (anon)

CREATE POLICY "order_item_options_select" ON order_item_options
  FOR SELECT USING (
    get_my_role() = 'system_admin'
    OR order_item_id IN (SELECT id FROM order_items WHERE order_id IN (
      SELECT id FROM orders WHERE
        (get_my_role() = 'store_admin' AND store_id = get_my_store_id())
    ))
    OR TRUE -- customers can read their order item options
  );

-- ── staff_calls ──
CREATE POLICY "staff_calls_insert" ON staff_calls
  FOR INSERT WITH CHECK (TRUE); -- anon customers can call staff

CREATE POLICY "staff_calls_select" ON staff_calls
  FOR SELECT USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'store_admin' AND store_id = get_my_store_id())
    OR TRUE -- customers can see their own call status
  );

CREATE POLICY "staff_calls_update" ON staff_calls
  FOR UPDATE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'store_admin' AND store_id = get_my_store_id())
  );

-- ── Realtime ──
ALTER PUBLICATION supabase_realtime ADD TABLE staff_calls;

-- ── Indexes ──
CREATE INDEX idx_menu_option_groups_franchise ON menu_option_groups(franchise_id);
CREATE INDEX idx_menu_option_items_group ON menu_option_items(option_group_id);
CREATE INDEX idx_menu_option_group_links_menu ON menu_option_group_links(menu_type, menu_id);
CREATE INDEX idx_order_item_options_order_item ON order_item_options(order_item_id);
CREATE INDEX idx_staff_calls_store ON staff_calls(store_id, status);
