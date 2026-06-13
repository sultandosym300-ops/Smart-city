import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useI18n } from "@/lib/i18n";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ReportRow } from "@/lib/types";
import { SignedImage } from "@/components/SignedImage";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  adminConfirmReport,
  adminReturnReport,
  adminApproveReport,
} from "@/lib/admin.functions";
import { Lock, Building, HardHat, Sparkles, CheckCircle2, Wrench } from "lucide-react";

const GATE_KEY = "admin_gate";
const PASS_KEY = "admin_password";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Кабинет акимата — Smart City" }] }),
  component: AdminEntry,
});

function AdminEntry() {
  const [password, setPassword] = useState<string | null>(null);
  const [view, setView] = useState<"choice" | "akimat">("choice");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem(PASS_KEY);
    if (saved === "admin123") setPassword(saved);
  }, []);

  if (!password) {
    return <GateForm onSuccess={(p) => {
      sessionStorage.setItem(PASS_KEY, p);
      sessionStorage.setItem(GATE_KEY, "1");
      setPassword(p);
    }} />;
  }

  if (view === "choice") {
    return <ChoiceScreen onPick={(v) => setView(v)} onLogout={() => {
      sessionStorage.removeItem(PASS_KEY);
      sessionStorage.removeItem(GATE_KEY);
      setPassword(null);
    }} />;
  }

  return (
    <AkimatDashboard
      password={password}
      onBack={() => setView("choice")}
      onLogout={() => {
        sessionStorage.removeItem(PASS_KEY);
        sessionStorage.removeItem(GATE_KEY);
        setPassword(null);
        setView("choice");
      }}
    />
  );
}

function GateForm({ onSuccess }: { onSuccess: (p: string) => void }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (value === "admin123") {
      toast.success("Доступ разрешён");
      onSuccess(value);
    } else {
      toast.error("Неверный пароль");
      setLoading(false);
    }
  };
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="bg-card rounded-2xl border p-8 shadow-sm">
          <div className="bg-primary/10 text-primary mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Защищённый вход</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Раздел доступен только сотрудникам акимата и городских служб.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label>Пароль</Label>
              <Input
                type="password"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              Войти
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ChoiceScreen({
  onPick,
  onLogout,
}: {
  onPick: (v: "akimat") => void;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Выберите кабинет</h1>
          <Button variant="ghost" size="sm" onClick={onLogout}>Выйти</Button>
        </div>
        <p className="text-muted-foreground mt-2">
          Доступ разрешён. Выберите, в какой кабинет вы хотите войти.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <button
            onClick={() => onPick("akimat")}
            className="bg-card group rounded-2xl border p-8 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="bg-primary/10 text-primary inline-flex h-14 w-14 items-center justify-center rounded-xl">
              <Building className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-xl font-bold">Панель Акимата</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Подтверждение заявок, ИИ-рекомендации, статистика по службам и контроль выполнения.
            </p>
          </button>
          <button
            onClick={() => navigate({ to: "/worker" })}
            className="bg-card group rounded-2xl border p-8 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
              <HardHat className="h-7 w-7" />
            </div>
            <h3 className="mt-5 text-xl font-bold">Панель Рабочих</h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Канбан задач, фильтрация ИИ по сфере деятельности бригады, фотоотчёты.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

function AkimatDashboard({
  password,
  onBack,
  onLogout,
}: {
  password: string;
  onBack: () => void;
  onLogout: () => void;
}) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: reports } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as ReportRow[];
    },
  });
  const { data: services } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await supabase.from("services").select("*")).data ?? [],
  });
  const { data: aiByReport } = useQuery({
    queryKey: ["ai-by-report"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_analysis")
        .select("report_id, reason, solution, raw")
        .order("created_at", { ascending: false })
        .limit(1000);
      const map: Record<string, { reason: string | null; solution: string | null; resources: string | null }> = {};
      for (const row of data ?? []) {
        if (map[row.report_id]) continue;
        const raw = (row.raw ?? {}) as { resources?: string };
        map[row.report_id] = {
          reason: row.reason,
          solution: row.solution,
          resources: raw?.resources ?? null,
        };
      }
      return map;
    },
  });

  const all = reports ?? [];
  const stats = {
    total: all.length,
    high: all.filter((r) => r.priority === "high").length,
    inProgress: all.filter((r) => r.status === "in_progress").length,
    awaiting: all.filter((r) => r.status === "awaiting_confirmation").length,
    done: all.filter((r) => r.status === "completed").length,
  };
  const filtered = statusFilter === "all" ? all : all.filter((r) => r.status === statusFilter);
  const byService = (services ?? []).map((s) => ({
    name: s.name_ru,
    count: all.filter((r) => r.service_id === s.id).length,
  }));

  const approve = async (r: ReportRow) => {
    try {
      await adminApproveReport({ data: { password, reportId: r.id } });
      toast.success("Одобрено и направлено в службу");
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    }
  };
  const confirm = async (r: ReportRow) => {
    try {
      await adminConfirmReport({ data: { password, reportId: r.id } });
      toast.success("Подтверждено");
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    }
  };
  const sendBack = async (r: ReportRow) => {
    const reason = window.prompt(t("admin.returnReason"));
    if (!reason) return;
    try {
      await adminReturnReport({ data: { password, reportId: r.id, reason } });
      toast.success("Возвращено на доработку");
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}>← Назад к выбору</Button>
            <Button variant="outline" size="sm" onClick={onLogout}>Выйти</Button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label={t("admin.stats.total")} value={stats.total} />
          <Stat label={t("admin.stats.high")} value={stats.high} tone="destructive" />
          <Stat label={t("admin.stats.inProgress")} value={stats.inProgress} tone="accent" />
          <Stat label="Ожидают подтверждения" value={stats.awaiting} />
          <Stat label={t("admin.stats.done")} value={stats.done} tone="success" />
        </div>

        <div className="mt-8">
          <div className="bg-card rounded-xl border p-4">
            <h3 className="text-sm font-semibold">{t("admin.byService")}</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {byService.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="font-semibold">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-3 flex flex-wrap gap-2">
            {["all", "new", "approved", "in_progress", "awaiting_confirmation", "completed", "returned"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-secondary"
                }`}
              >
                {s === "all" ? t("common.allStatuses") : t(`report.status.${s}` as never)}
              </button>
            ))}
          </div>
          <div className="grid gap-3">
            {filtered.map((r) => {
              const ai = aiByReport?.[r.id];
              return (
                <div key={r.id} className="bg-card rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.status} />
                    <PriorityBadge priority={r.priority} />
                    <span className="text-muted-foreground ml-auto text-xs">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-[140px_1fr_auto]">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="text-muted-foreground mb-1 text-[10px] uppercase">{t("common.before")}</div>
                        <SignedImage path={r.photo_url} alt="" className="h-24 w-full rounded object-cover" />
                      </div>
                      {r.completion_photo_url && (
                        <div className="flex-1">
                          <div className="text-muted-foreground mb-1 text-[10px] uppercase">{t("common.after")}</div>
                          <SignedImage path={r.completion_photo_url} alt="" className="h-24 w-full rounded object-cover" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm">{r.description}</p>
                      <div className="text-muted-foreground mt-1 text-xs">
                        {r.address ?? `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}`}
                      </div>
                      {ai && (ai.reason || ai.solution || ai.resources) && (
                        <div className="mt-3 rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3 text-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-indigo-700">
                            <Sparkles className="h-3.5 w-3.5" /> Совет от ИИ (Gemini)
                          </div>
                          {ai.solution && (
                            <p className="mt-1.5"><span className="font-medium">Рекомендуется:</span> {ai.solution}</p>
                          )}
                          {ai.resources && (
                            <p className="mt-1 flex items-start gap-1">
                              <Wrench className="mt-0.5 h-3 w-3 shrink-0" />
                              <span><span className="font-medium">Необходимые ресурсы:</span> {ai.resources}</span>
                            </p>
                          )}
                          {ai.reason && (
                            <p className="text-muted-foreground mt-1 italic">{ai.reason}</p>
                          )}
                        </div>
                      )}
                      {r.completion_comment && (
                        <p className="text-muted-foreground mt-2 text-xs italic">«{r.completion_comment}»</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {r.status === "new" && (
                        <Button size="sm" onClick={() => approve(r)}>
                          <CheckCircle2 className="mr-1 h-4 w-4" /> Одобрить и направить
                        </Button>
                      )}
                      {r.status === "awaiting_confirmation" && (
                        <>
                          <Button size="sm" onClick={() => confirm(r)}>{t("admin.confirm")}</Button>
                          <Button size="sm" variant="outline" onClick={() => sendBack(r)}>{t("admin.return")}</Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "destructive" | "accent" | "success" }) {
  const toneClass =
    tone === "destructive" ? "text-destructive" : tone === "accent" ? "text-amber-700" : tone === "success" ? "text-emerald-700" : "";
  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="text-muted-foreground text-[11px] font-medium uppercase">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}