-- 002_fix_rls_recursion.sql
-- Fix infinite recursion in user_profiles RLS policies
-- by using SECURITY DEFINER helper functions

-- 1. Helper functions (bypass RLS to check current user's role/franchise)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_franchise_id()
RETURNS UUID AS $$
  SELECT franchise_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_is_approved()
RETURNS BOOLEAN AS $$
  SELECT is_approved FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Drop old problematic policies
DROP POLICY IF EXISTS "System admin can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Brand admin can read franchise profiles" ON user_profiles;
DROP POLICY IF EXISTS "System admin can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Brand admin can update franchise store admins" ON user_profiles;
DROP POLICY IF EXISTS "System admin can manage all user permissions" ON user_permissions;
DROP POLICY IF EXISTS "Brand admin can manage franchise user permissions" ON user_permissions;

-- 3. Recreate policies using helper functions (no recursion)

-- SELECT policies for user_profiles
CREATE POLICY "System admin can read all profiles"
  ON user_profiles FOR SELECT
  USING (get_my_role() = 'system_admin' AND get_my_is_approved() = TRUE);

CREATE POLICY "Brand admin can read franchise profiles"
  ON user_profiles FOR SELECT
  USING (
    get_my_role() = 'brand_admin'
    AND get_my_is_approved() = TRUE
    AND franchise_id = get_my_franchise_id()
  );

-- UPDATE policies for user_profiles
CREATE POLICY "System admin can update all profiles"
  ON user_profiles FOR UPDATE
  USING (get_my_role() = 'system_admin' AND get_my_is_approved() = TRUE);

CREATE POLICY "Brand admin can update franchise store admins"
  ON user_profiles FOR UPDATE
  USING (
    get_my_role() = 'brand_admin'
    AND get_my_is_approved() = TRUE
    AND franchise_id = get_my_franchise_id()
    AND role IN ('store_admin', 'pending')
  );

-- ALL policies for user_permissions
CREATE POLICY "System admin can manage all user permissions"
  ON user_permissions FOR ALL
  USING (get_my_role() = 'system_admin' AND get_my_is_approved() = TRUE);

CREATE POLICY "Brand admin can manage franchise user permissions"
  ON user_permissions FOR ALL
  USING (
    get_my_role() = 'brand_admin'
    AND get_my_is_approved() = TRUE
    AND user_id IN (
      SELECT id FROM user_profiles
      WHERE franchise_id = get_my_franchise_id()
        AND role IN ('store_admin', 'pending')
    )
  );
