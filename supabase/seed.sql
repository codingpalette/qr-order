-- Seed: Default role permissions
-- system_admin permissions
INSERT INTO role_permissions (role, permission) VALUES
  ('system_admin', 'franchise:read'),
  ('system_admin', 'franchise:write'),
  ('system_admin', 'store:read'),
  ('system_admin', 'store:write'),
  ('system_admin', 'menu:read'),
  ('system_admin', 'menu:write'),
  ('system_admin', 'order:read'),
  ('system_admin', 'user:read'),
  ('system_admin', 'user:approve'),
  ('system_admin', 'settings:read'),
  ('system_admin', 'settings:write');

-- brand_admin permissions
INSERT INTO role_permissions (role, permission) VALUES
  ('brand_admin', 'franchise:read'),
  ('brand_admin', 'store:read'),
  ('brand_admin', 'store:write'),
  ('brand_admin', 'menu:read'),
  ('brand_admin', 'menu:write'),
  ('brand_admin', 'order:read'),
  ('brand_admin', 'user:read'),
  ('brand_admin', 'user:approve'),
  ('brand_admin', 'settings:read');

-- store_admin permissions
INSERT INTO role_permissions (role, permission) VALUES
  ('store_admin', 'store:read'),
  ('store_admin', 'menu:read'),
  ('store_admin', 'menu:write'),
  ('store_admin', 'order:read'),
  ('store_admin', 'order:write'),
  ('store_admin', 'settings:read'),
  ('store_admin', 'settings:write');
