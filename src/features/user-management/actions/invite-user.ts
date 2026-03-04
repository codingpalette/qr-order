"use server";

import { createAdminClient } from "@/shared/api/supabase/admin";
import { createClient } from "@/shared/api/supabase/server";
import type { UserRole } from "@/entities/user/model/types";

interface InviteUserInput {
  email: string;
  name: string;
  password: string;
  role: Exclude<UserRole, "pending">;
  franchiseId?: string | null;
  storeId?: string | null;
}

interface InviteUserResult {
  success: boolean;
  error?: string;
}

export async function inviteUser(input: InviteUserInput): Promise<InviteUserResult> {
  // Verify the caller is authenticated and is a brand_admin or system_admin
  const supabase = await createClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();

  if (!caller) {
    return { success: false, error: "인증되지 않은 요청입니다." };
  }

  const { data: callerProfile } = await supabase
    .from("user_profiles")
    .select("role, franchise_id")
    .eq("id", caller.id)
    .single();

  if (!callerProfile || !["brand_admin", "system_admin"].includes(callerProfile.role)) {
    return { success: false, error: "팀원 추가 권한이 없습니다." };
  }

  // Create auth user via admin API
  const admin = createAdminClient();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      name: input.name,
      requested_role: input.role,
    },
  });

  if (authError) {
    if (authError.message.includes("already been registered")) {
      return { success: false, error: "이미 등록된 이메일입니다." };
    }
    return { success: false, error: `계정 생성 실패: ${authError.message}` };
  }

  if (!authData.user) {
    return { success: false, error: "계정 생성에 실패했습니다." };
  }

  // Update the auto-created profile with correct role, franchise, store, approval
  const { error: updateError } = await admin
    .from("user_profiles")
    .update({
      name: input.name,
      role: input.role,
      franchise_id: input.franchiseId,
      store_id: input.storeId ?? null,
      is_approved: true,
      approved_by: caller.id,
    })
    .eq("id", authData.user.id);

  if (updateError) {
    return { success: false, error: `프로필 업데이트 실패: ${updateError.message}` };
  }

  return { success: true };
}
