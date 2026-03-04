"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/shared/api/supabase/client";
import type { UserProfile } from "../model/types";

interface UserPermissionOverride {
  permission: string;
  granted: boolean;
}

interface UserProfileData {
  profile: UserProfile | null;
  rolePermissions: string[];
  userOverrides: UserPermissionOverride[];
}

export function useUserProfile() {
  return useQuery<UserProfileData>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { profile: null, rolePermissions: [], userOverrides: [] };
      }

      // Fetch profile
      const { data: profileRow } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profileRow) {
        return { profile: null, rolePermissions: [], userOverrides: [] };
      }

      // Cast needed: manual Database type stub doesn't fully satisfy Supabase generics.
      // Replace with `supabase gen types` output for full type safety.
      const profile = profileRow as unknown as UserProfile;

      // Fetch role permissions
      const { data: rolePerms } = await supabase
        .from("role_permissions")
        .select("permission")
        .eq("role", profile.role);

      // Fetch user permission overrides
      const { data: userPerms } = await supabase
        .from("user_permissions")
        .select("permission, granted")
        .eq("user_id", user.id);

      return {
        profile,
        rolePermissions: ((rolePerms ?? []) as { permission: string }[]).map(
          (rp) => rp.permission,
        ),
        userOverrides: (userPerms ?? []) as UserPermissionOverride[],
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
