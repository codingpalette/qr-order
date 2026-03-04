-- 세트 메뉴
CREATE TABLE set_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  cost_price INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_set_menus_updated_at
  BEFORE UPDATE ON set_menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_set_menus_franchise ON set_menus(franchise_id);
CREATE INDEX idx_set_menus_category ON set_menus(category_id);

ALTER TABLE set_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "set_menus_select" ON set_menus
  FOR SELECT USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() IN ('brand_admin', 'store_admin') AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "set_menus_insert" ON set_menus
  FOR INSERT WITH CHECK (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "set_menus_update" ON set_menus
  FOR UPDATE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "set_menus_delete" ON set_menus
  FOR DELETE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

-- 고객 익명 접근
CREATE POLICY "set_menus_anon_select" ON set_menus
  FOR SELECT TO anon USING (true);

-- 세트 메뉴 구성 아이템
CREATE TABLE set_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_menu_id UUID NOT NULL REFERENCES set_menus(id) ON DELETE CASCADE,
  master_menu_id UUID NOT NULL REFERENCES master_menus(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(set_menu_id, master_menu_id)
);

CREATE INDEX idx_set_menu_items_set ON set_menu_items(set_menu_id);

ALTER TABLE set_menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "set_menu_items_select" ON set_menu_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM set_menus sm WHERE sm.id = set_menu_id
      AND (
        get_my_role() = 'system_admin'
        OR (get_my_role() IN ('brand_admin', 'store_admin') AND sm.franchise_id = get_my_franchise_id())
      )
    )
  );

CREATE POLICY "set_menu_items_insert" ON set_menu_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM set_menus sm WHERE sm.id = set_menu_id
      AND (
        get_my_role() = 'system_admin'
        OR (get_my_role() = 'brand_admin' AND sm.franchise_id = get_my_franchise_id())
      )
    )
  );

CREATE POLICY "set_menu_items_delete" ON set_menu_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM set_menus sm WHERE sm.id = set_menu_id
      AND (
        get_my_role() = 'system_admin'
        OR (get_my_role() = 'brand_admin' AND sm.franchise_id = get_my_franchise_id())
      )
    )
  );

-- 고객 익명 접근
CREATE POLICY "set_menu_items_anon_select" ON set_menu_items
  FOR SELECT TO anon USING (true);

-- order_items menu_type 확장
ALTER TABLE order_items DROP CONSTRAINT order_items_menu_type_check;
ALTER TABLE order_items ADD CONSTRAINT order_items_menu_type_check
  CHECK (menu_type IN ('master', 'local', 'set'));
