"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/entities/user/api/useUserProfile";
import { resolvePermissions } from "@/entities/user/lib/permissions";
import { createClient } from "@/shared/api/supabase/client";
import type { Permission, UserProfile } from "@/entities/user/model/types";

interface AuthContextValue {
  user: UserProfile | null;
  permissions: Set<string>;
  hasPermission: (permission: Permission) => boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data, isLoading } = useUserProfile();

  const permissions = useMemo(() => {
    if (!data?.profile) return new Set<string>();
    return resolvePermissions(data.rolePermissions, data.userOverrides);
  }, [data]);

  const hasPermission = useCallback(
    (permission: Permission) => permissions.has(permission),
    [permissions],
  );

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data?.profile ?? null,
      permissions,
      hasPermission,
      isLoading,
      signOut,
    }),
    [data?.profile, permissions, hasPermission, isLoading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
