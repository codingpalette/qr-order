-- 시간대별 메뉴 스케줄
CREATE TABLE menu_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_menu_schedules_updated_at
  BEFORE UPDATE ON menu_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_menu_schedules_franchise ON menu_schedules(franchise_id);

ALTER TABLE menu_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu_schedules_select" ON menu_schedules
  FOR SELECT USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() IN ('brand_admin', 'store_admin') AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "menu_schedules_insert" ON menu_schedules
  FOR INSERT WITH CHECK (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "menu_schedules_update" ON menu_schedules
  FOR UPDATE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

CREATE POLICY "menu_schedules_delete" ON menu_schedules
  FOR DELETE USING (
    get_my_role() = 'system_admin'
    OR (get_my_role() = 'brand_admin' AND franchise_id = get_my_franchise_id())
  );

-- 고객 익명 접근
CREATE POLICY "menu_schedules_anon_select" ON menu_schedules
  FOR SELECT TO anon USING (true);

-- 스케줄-메뉴 링크
CREATE TABLE menu_schedule_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES menu_schedules(id) ON DELETE CASCADE,
  menu_type TEXT NOT NULL CHECK (menu_type IN ('master', 'local')),
  menu_id UUID NOT NULL,
  UNIQUE(schedule_id, menu_type, menu_id)
);

CREATE INDEX idx_menu_schedule_links_schedule ON menu_schedule_links(schedule_id);
CREATE INDEX idx_menu_schedule_links_menu ON menu_schedule_links(menu_type, menu_id);

ALTER TABLE menu_schedule_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu_schedule_links_select" ON menu_schedule_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM menu_schedules ms WHERE ms.id = schedule_id
      AND (
        get_my_role() = 'system_admin'
        OR (get_my_role() IN ('brand_admin', 'store_admin') AND ms.franchise_id = get_my_franchise_id())
      )
    )
  );

CREATE POLICY "menu_schedule_links_insert" ON menu_schedule_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM menu_schedules ms WHERE ms.id = schedule_id
      AND (
        get_my_role() = 'system_admin'
        OR (get_my_role() = 'brand_admin' AND ms.franchise_id = get_my_franchise_id())
      )
    )
  );

CREATE POLICY "menu_schedule_links_delete" ON menu_schedule_links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM menu_schedules ms WHERE ms.id = schedule_id
      AND (
        get_my_role() = 'system_admin'
        OR (get_my_role() = 'brand_admin' AND ms.franchise_id = get_my_franchise_id())
      )
    )
  );

-- 고객 익명 접근
CREATE POLICY "menu_schedule_links_anon_select" ON menu_schedule_links
  FOR SELECT TO anon USING (true);
