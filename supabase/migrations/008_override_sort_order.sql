-- ============================================================
-- 008: Add sort_order to store_menu_overrides
-- Allows store admins to customize menu display order per-store
-- ============================================================

ALTER TABLE store_menu_overrides ADD COLUMN sort_order INTEGER DEFAULT NULL;
