-- ============================================================
-- 005: Menu Categories & Master Menus
-- ============================================================

-- Menu Categories (franchise-level)
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_menu_categories_updated_at
  BEFORE UPDATE ON menu_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Master Menus (franchise-level shared menu items)
CREATE TABLE IF NOT EXISTS master_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
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

CREATE TRIGGER set_master_menus_updated_at
  BEFORE UPDATE ON master_menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_menus ENABLE ROW LEVEL SECURITY;

-- Menu Categories Policies
CREATE POLICY "menu_categories_select" ON menu_categories
  FOR SELECT USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() IN ('brand_admin', 'store_admin') AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "menu_categories_insert" ON menu_categories
  FOR INSERT WITH CHECK (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "menu_categories_update" ON menu_categories
  FOR UPDATE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "menu_categories_delete" ON menu_categories
  FOR DELETE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

-- Master Menus Policies
CREATE POLICY "master_menus_select" ON master_menus
  FOR SELECT USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() IN ('brand_admin', 'store_admin') AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "master_menus_insert" ON master_menus
  FOR INSERT WITH CHECK (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "master_menus_update" ON master_menus
  FOR UPDATE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "master_menus_delete" ON master_menus
  FOR DELETE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

-- ============================================================
-- Storage: menu-images bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "menu_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "menu_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'menu-images'
    AND auth.role() = 'authenticated'
    AND (get_my_role() IN ('system_admin', 'brand_admin', 'store_admin'))
  );

CREATE POLICY "menu_images_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'menu-images'
    AND auth.role() = 'authenticated'
    AND (get_my_role() IN ('system_admin', 'brand_admin', 'store_admin'))
  );

CREATE POLICY "menu_images_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'menu-images'
    AND auth.role() = 'authenticated'
    AND (get_my_role() IN ('system_admin', 'brand_admin', 'store_admin'))
  );
