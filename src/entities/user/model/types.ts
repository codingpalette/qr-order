export type UserRole = "pending" | "system_admin" | "brand_admin" | "store_admin";

export type Permission =
  | "franchise:read"
  | "franchise:write"
  | "store:read"
  | "store:write"
  | "menu:read"
  | "menu:write"
  | "order:read"
  | "order:write"
  | "user:read"
  | "user:approve"
  | "settings:read"
  | "settings:write";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  franchise_id: string | null;
  store_id: string | null;
  is_approved: boolean;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}
