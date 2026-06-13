import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ADMIN_PASSWORD = "admin123";

const verifyPassword = (password: string) => {
  if (password !== ADMIN_PASSWORD) {
    throw new Error("Неверный пароль администратора");
  }
};

export const adminConfirmReport = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ password: z.string(), reportId: z.string() }).parse(data),
  )
  .handler(async ({ data }) => {
    verifyPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("reports")
      .select("status")
      .eq("id", data.reportId)
      .maybeSingle();
    const { error } = await supabaseAdmin
      .from("reports")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", data.reportId);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("report_history").insert({
      report_id: data.reportId,
      action: "confirm",
      from_status: existing?.status ?? null,
      to_status: "completed",
    });
    return { ok: true };
  });

export const adminReturnReport = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({ password: z.string(), reportId: z.string(), reason: z.string() })
      .parse(data),
  )
  .handler(async ({ data }) => {
    verifyPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("reports")
      .select("status")
      .eq("id", data.reportId)
      .maybeSingle();
    const { error } = await supabaseAdmin
      .from("reports")
      .update({ status: "in_progress", awaiting_at: null })
      .eq("id", data.reportId);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("report_history").insert({
      report_id: data.reportId,
      action: "return",
      from_status: existing?.status ?? null,
      to_status: "in_progress",
      comment: data.reason,
    });
    return { ok: true };
  });

export const adminApproveReport = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ password: z.string(), reportId: z.string() }).parse(data),
  )
  .handler(async ({ data }) => {
    verifyPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("reports")
      .select("status")
      .eq("id", data.reportId)
      .maybeSingle();
    const { error } = await supabaseAdmin
      .from("reports")
      .update({ status: "approved" })
      .eq("id", data.reportId);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("report_history").insert({
      report_id: data.reportId,
      action: "approve",
      from_status: existing?.status ?? null,
      to_status: "approved",
    });
    return { ok: true };
  });
