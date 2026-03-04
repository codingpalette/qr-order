-- 재고 관리
CREATE TABLE menu_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  menu_type TEXT NOT NULL CHECK (menu_type IN ('master', 'local')),
  menu_id UUID NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT -1,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, menu_type, menu_id)
);

CREATE TRIGGER set_menu_stock_updated_at
  BEFORE UPDATE ON menu_stock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_menu_stock_store ON menu_stock(store_id);
CREATE INDEX idx_menu_stock_menu ON menu_stock(menu_type, menu_id);

ALTER TABLE menu_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu_stock_select" ON menu_stock
  FOR SELECT USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() IN ('brand_admin', 'store_admin') AND store_id IN (
      SELECT id FROM stores WHERE franchise_id = get_my_franchise_id()
    ))
  );

CREATE POLICY "menu_stock_insert" ON menu_stock
  FOR INSERT WITH CHECK (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'store_admin' AND store_id = get_my_store_id())
  );

CREATE POLICY "menu_stock_update" ON menu_stock
  FOR UPDATE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'store_admin' AND store_id = get_my_store_id())
  );

CREATE POLICY "menu_stock_delete" ON menu_stock
  FOR DELETE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'store_admin' AND store_id = get_my_store_id())
  );

-- 고객 익명 접근 (품절 표시를 위해)
CREATE POLICY "menu_stock_anon_select" ON menu_stock
  FOR SELECT TO anon USING (true);

-- 재고 차감 함수
CREATE OR REPLACE FUNCTION decrement_stock(
  p_store_id UUID,
  p_menu_type TEXT,
  p_menu_id UUID,
  p_quantity INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stock_row menu_stock%ROWTYPE;
  v_new_quantity INTEGER;
BEGIN
  -- FOR UPDATE 락으로 동시성 보호
  SELECT * INTO v_stock_row
  FROM menu_stock
  WHERE store_id = p_store_id
    AND menu_type = p_menu_type
    AND menu_id = p_menu_id
  FOR UPDATE;

  -- 재고 추적이 없거나 무제한이면 무시
  IF NOT FOUND OR v_stock_row.stock_quantity = -1 THEN
    RETURN -1;
  END IF;

  v_new_quantity := GREATEST(0, v_stock_row.stock_quantity - p_quantity);

  UPDATE menu_stock
  SET stock_quantity = v_new_quantity, updated_at = now()
  WHERE id = v_stock_row.id;

  -- 재고 0이 되면 자동 품절 처리
  IF v_new_quantity = 0 THEN
    IF p_menu_type = 'master' THEN
      INSERT INTO store_menu_overrides (store_id, master_menu_id, is_sold_out)
      VALUES (p_store_id, p_menu_id, TRUE)
      ON CONFLICT (store_id, master_menu_id)
      DO UPDATE SET is_sold_out = TRUE;
    ELSIF p_menu_type = 'local' THEN
      UPDATE local_menus SET is_active = FALSE WHERE id = p_menu_id;
    END IF;
  END IF;

  RETURN v_new_quantity;
END;
$$;
