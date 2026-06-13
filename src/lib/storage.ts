import { supabase } from "@/integrations/supabase/client";

export async function uploadReportPhoto(file: File, prefix = "uploads"): Promise<string | null> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const { error } = await supabase.storage.from("reports").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) {
    console.error("upload error", error);
    return null;
  }
  return path;
}

/** Get a long-lived signed URL for displaying an image from the private bucket. */
export async function getSignedUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  // If somehow a full URL was stored, return it directly
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from("reports").createSignedUrl(path, 60 * 60 * 24);
  return data?.signedUrl ?? null;
}