-- 001_auth_and_permissions.sql
-- Core tables + Auth & RBAC permission system for QR-Order Pro

-- 0. Core business tables (franchises, stores, tables)
CREATE TABLE franchises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  pg_merchant_key TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  qr_code_url TEXT
);

CREATE INDEX idx_stores_franchise ON stores(franchise_id);
CREATE INDEX idx_tables_store ON tables(store_id);

-- 1. ENUM type for user roles
CREATE TYPE user_role AS ENUM ('pending', 'system_admin', 'brand_admin', 'store_admin');

-- 2. user_profiles (linked to auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'pending',
  franchise_id UUID REFERENCES franchises(id),
  store_id UUID REFERENCES stores(id),
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. role_permissions (default permissions per role)
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission TEXT NOT NULL,
  UNIQUE(role, permission)
);

-- 4. user_permissions (individual overrides)
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(user_id, permission)
);

-- 5. Indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_franchise ON user_profiles(franchise_id);
CREATE INDEX idx_user_profiles_store ON user_profiles(store_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);

-- 6. Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. Auto-create user_profiles on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role, is_approved)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'pending',
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 8. Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for user_profiles
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- system_admin can read all profiles
CREATE POLICY "System admin can read all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'system_admin' AND is_approved = TRUE
    )
  );

-- brand_admin can read profiles in their franchise
CREATE POLICY "Brand admin can read franchise profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles AS admin
      WHERE admin.id = auth.uid()
        AND admin.role = 'brand_admin'
        AND admin.is_approved = TRUE
        AND admin.franchise_id = user_profiles.franchise_id
    )
  );

-- system_admin can update all profiles
CREATE POLICY "System admin can update all profiles"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'system_admin' AND is_approved = TRUE
    )
  );

-- brand_admin can update store_admin profiles in their franchise
CREATE POLICY "Brand admin can update franchise store admins"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles AS admin
      WHERE admin.id = auth.uid()
        AND admin.role = 'brand_admin'
        AND admin.is_approved = TRUE
        AND admin.franchise_id = user_profiles.franchise_id
        AND user_profiles.role IN ('store_admin', 'pending')
    )
  );

-- Users can update their own name
CREATE POLICY "Users can update own name"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 10. RLS Policies for role_permissions (read-only for authenticated users)
CREATE POLICY "Authenticated users can read role permissions"
  ON role_permissions FOR SELECT
  USING (auth.role() = 'authenticated');

-- 11. RLS Policies for user_permissions
-- Users can read their own permissions
CREATE POLICY "Users can read own permissions"
  ON user_permissions FOR SELECT
  USING (user_id = auth.uid());

-- system_admin can manage all user permissions
CREATE POLICY "System admin can manage all user permissions"
  ON user_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'system_admin' AND is_approved = TRUE
    )
  );

-- brand_admin can manage permissions for users in their franchise
CREATE POLICY "Brand admin can manage franchise user permissions"
  ON user_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles AS admin
      WHERE admin.id = auth.uid()
        AND admin.role = 'brand_admin'
        AND admin.is_approved = TRUE
        AND user_permissions.user_id IN (
          SELECT up.id FROM user_profiles AS up
          WHERE up.franchise_id = admin.franchise_id
            AND up.role IN ('store_admin', 'pending')
        )
    )
  );
