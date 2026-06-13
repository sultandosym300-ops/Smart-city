import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ReportRow } from "@/lib/types";
import { SignedImage } from "@/components/SignedImage";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import type { ReportStatus } from "@/lib/types";
import { Check } from "lucide-react";

export const Route = createFileRoute("/my-reports")({
  head: () => ({ meta: [{ title: "Мои обращения — Smart City" }] }),
  component: MyReports,
});

function MyReports() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data } = useQuery({
    queryKey: ["my-reports", user?.id],
    enabled: !loading && !!user?.id,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    queryFn: async () => {
      // Re-read the authenticated user at fetch-time to avoid race conditions
      // between AuthProvider state and Supabase's restored session.
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData?.user?.id ?? user!.id;
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("created_by", uid)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReportRow[];
    },
  });

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-bold">{t("my.title")}</h1>
        {!data?.length ? (
          <div className="text-muted-foreground bg-card mt-8 rounded-xl border p-10 text-center">
            {t("my.empty")} — <Link to="/report/new" className="text-primary underline">{t("nav.new")}</Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {data.map((r) => (
              <div key={r.id} className="bg-card flex gap-4 rounded-xl border p-4">
                <SignedImage path={r.photo_url} alt="" className="h-24 w-24 rounded-lg object-cover" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.status} />
                    <PriorityBadge priority={r.priority} />
                    {r.category && (
                      <span className="bg-secondary rounded-full px-2 py-0.5 text-xs">{t(`cat.${r.category}` as const)}</span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm">{r.description}</p>
                  <div className="text-muted-foreground mt-1 text-xs">
                    {new Date(r.created_at).toLocaleString()} · {r.address ?? `${r.lat.toFixed(3)}, ${r.lng.toFixed(3)}`}
                  </div>
                  <StatusTracker status={r.status} />
                  {r.status === "completed" && r.completion_photo_url && (
                    <div className="mt-4 rounded-xl border bg-emerald-500/5 p-3">
                      <div className="mb-2 text-xs font-semibold text-emerald-700">
                        ✅ Работа завершена — сравнение «До / После»
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-muted-foreground mb-1 text-[10px] font-medium uppercase">
                            {t("common.before")}
                          </div>
                          <SignedImage path={r.photo_url} alt="до" className="h-32 w-full rounded-lg object-cover" />
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1 text-[10px] font-medium uppercase">
                            {t("common.after")}
                          </div>
                          <SignedImage path={r.completion_photo_url} alt="после" className="h-32 w-full rounded-lg object-cover" />
                        </div>
                      </div>
                      {r.completion_comment && (
                        <p className="text-muted-foreground mt-2 text-xs italic">
                          Отчёт бригады: «{r.completion_comment}»
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusTracker({ status }: { status: ReportStatus }) {
  const steps: { key: ReportStatus[]; label: string; emoji: string }[] = [
    { key: ["new"], label: "Отправлено", emoji: "🟡" },
    { key: ["approved"], label: "Подтверждено Акиматом", emoji: "🔵" },
    { key: ["in_progress", "awaiting_confirmation"], label: "Принято рабочими", emoji: "🟠" },
    { key: ["completed"], label: "Завершено", emoji: "🟢" },
  ];
  const order: ReportStatus[] = ["new", "approved", "in_progress", "awaiting_confirmation", "completed"];
  const idx = Math.max(0, order.indexOf(status));
  const currentStep = steps.findIndex((s) => s.key.includes(status));
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {steps.map((s, i) => {
        const done = i < currentStep || status === "completed";
        const active = i === currentStep;
        return (
          <div
            key={s.label}
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${
              active
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : done
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                  : "border-muted text-muted-foreground"
            }`}
          >
            <span>{done ? <Check className="h-3 w-3" /> : s.emoji}</span>
            <span>{s.label}</span>
          </div>
        );
      })}
      {status === "returned" && (
        <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-700">
          Возвращено на доработку
        </span>
      )}
      <span className="sr-only">{idx}</span>
    </div>
  );
}