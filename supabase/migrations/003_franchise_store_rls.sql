-- 003_franchise_store_rls.sql
-- RLS policies for franchises, stores, and tables

-- 1. Enable RLS
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- franchises policies
-- ============================================================

-- system_admin: full CRUD
CREATE POLICY "System admin full access on franchises"
  ON franchises FOR ALL
  USING (get_my_role() = 'system_admin' AND get_my_is_approved() = TRUE);

-- brand_admin: read own franchise only
CREATE POLICY "Brand admin can read own franchise"
  ON franchises FOR SELECT
  USING (
    get_my_role() = 'brand_admin'
    AND get_my_is_approved() = TRUE
    AND id = get_my_franchise_id()
  );

-- store_admin: read franchise they belong to (via store -> franchise)
CREATE POLICY "Store admin can read own franchise"
  ON franchises FOR SELECT
  USING (
    get_my_role() = 'store_admin'
    AND get_my_is_approved() = TRUE
    AND id = get_my_franchise_id()
  );

-- ============================================================
-- stores policies
-- ============================================================

-- Helper: get current user's store_id
CREATE OR REPLACE FUNCTION get_my_store_id()
RETURNS UUID AS $$
  SELECT store_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- system_admin: full CRUD
CREATE POLICY "System admin full access on stores"
  ON stores FOR ALL
  USING (get_my_role() = 'system_admin' AND get_my_is_approved() = TRUE);

-- brand_admin: CRUD on stores in own franchise
CREATE POLICY "Brand admin can manage franchise stores"
  ON stores FOR ALL
  USING (
    get_my_role() = 'brand_admin'
    AND get_my_is_approved() = TRUE
    AND franchise_id = get_my_franchise_id()
  );

-- store_admin: read own store only
CREATE POLICY "Store admin can read own store"
  ON stores FOR SELECT
  USING (
    get_my_role() = 'store_admin'
    AND get_my_is_approved() = TRUE
    AND id = get_my_store_id()
  );

-- ============================================================
-- tables policies
-- ============================================================

-- system_admin: full CRUD
CREATE POLICY "System admin full access on tables"
  ON tables FOR ALL
  USING (get_my_role() = 'system_admin' AND get_my_is_approved() = TRUE);

-- brand_admin: CRUD on tables in own franchise's stores
CREATE POLICY "Brand admin can manage franchise tables"
  ON tables FOR ALL
  USING (
    get_my_role() = 'brand_admin'
    AND get_my_is_approved() = TRUE
    AND store_id IN (
      SELECT id FROM stores WHERE franchise_id = get_my_franchise_id()
    )
  );

-- store_admin: CRUD on tables in own store
CREATE POLICY "Store admin can manage own store tables"
  ON tables FOR ALL
  USING (
    get_my_role() = 'store_admin'
    AND get_my_is_approved() = TRUE
    AND store_id = get_my_store_id()
  );
