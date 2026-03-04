"use client";

import { createClient } from "./client";

const BUCKET = "franchise-logos";

export async function uploadFranchiseLogo(
  file: File,
  franchiseId: string,
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${franchiseId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}

// ── Menu Images ──

const MENU_BUCKET = "menu-images";

export async function uploadMenuImage(
  file: File,
  franchiseId: string,
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${franchiseId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(MENU_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(MENU_BUCKET).getPublicUrl(path);

  return publicUrl;
}

export async function deleteMenuImage(url: string): Promise<void> {
  const supabase = createClient();
  const marker = `${MENU_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;

  const path = url.slice(idx + marker.length);
  const { error } = await supabase.storage.from(MENU_BUCKET).remove([path]);
  if (error) throw error;
}

// ── Event Banner Images ──

const BANNER_BUCKET = "event-banners";

export async function uploadBannerImage(
  file: File,
  franchiseId: string,
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${franchiseId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BANNER_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BANNER_BUCKET).getPublicUrl(path);

  return publicUrl;
}

export async function deleteBannerImage(url: string): Promise<void> {
  const supabase = createClient();
  const marker = `${BANNER_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;

  const path = url.slice(idx + marker.length);
  const { error } = await supabase.storage.from(BANNER_BUCKET).remove([path]);
  if (error) throw error;
}

export async function deleteFranchiseLogo(url: string): Promise<void> {
  const supabase = createClient();

  // Extract path from public URL: ...franchise-logos/franchiseId/timestamp.ext
  const marker = `${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;

  const path = url.slice(idx + marker.length);
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
