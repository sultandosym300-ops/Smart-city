import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ReportRow, ReportStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SignedImage } from "@/components/SignedImage";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { uploadReportPhoto } from "@/lib/storage";
import { classifyDepartment } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Lock, HardHat, Sparkles, Camera, Lock as LockIcon } from "lucide-react";

const GATE_KEY = "admin_gate";

export const Route = createFileRoute("/worker")({
  head: () => ({ meta: [{ title: "Кабинет рабочих — Smart City" }] }),
  component: WorkerEntry,
});

function WorkerEntry() {
  const navigate = useNavigate();
  const [gated, setGated] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(GATE_KEY) === "1") setGated(true);
    else navigate({ to: "/admin" });
  }, [navigate]);

  if (!gated) {
    return (
      <div className="bg-background min-h-screen">
        <Header />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <LockIcon className="text-muted-foreground mx-auto h-10 w-10" />
          <p className="text-muted-foreground mt-3">Перенаправление…</p>
        </div>
      </div>
    );
  }

  return <WorkerGated />;
}

function WorkerGated() {
  const { user, roles, serviceId, loading, refresh } = useAuth();
  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <Header />
      </div>
    );
  }
  if (!user) return <WorkerAuth onDone={refresh} />;
  if (!roles.includes("worker") || !serviceId) return <WorkerEnroll onDone={refresh} />;
  return <WorkerKanban serviceId={serviceId} />;
}

// ---------------- Worker auth (sign in or sign up as worker) ----------------

function WorkerAuth({ onDone }: { onDone: () => Promise<void> }) {
  const classify = useServerFn(classifyDepartment);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [dept, setDept] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "up") {
        if (!dept.trim()) {
          toast.error("Укажите ваш отдел / сферу деятельности");
          setLoading(false);
          return;
        }
        const { data: signUp, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          },
        });
        if (error) throw error;
        // Make sure a session exists (auto-confirm is on)
        if (!signUp.session) {
          const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
          if (e2) throw e2;
        }
        await enrollWorker(dept, classify);
        toast.success("Аккаунт рабочего создан");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        // Bypass "Email not confirmed" hard-block for the demo.
        if (error && !/not confirmed|confirm/i.test(error.message)) throw error;
        toast.success("Вход выполнен");
      }
      await onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="bg-card rounded-2xl border p-8 shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
            <HardHat className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-2xl font-bold">{mode === "in" ? "Вход рабочего" : "Регистрация рабочего"}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Доступ к канбану задач вашей бригады. ИИ автоматически определит вашу сферу.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "up" && (
              <>
                <div>
                  <Label>ФИО</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <Label>Ваш отдел / сфера деятельности</Label>
                  <Textarea
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    rows={2}
                    placeholder="Например: Водоканал города, ремонт дорожного полотна, электрики-сетевики…"
                    required
                  />
                  <p className="text-muted-foreground mt-1 inline-flex items-center gap-1 text-[11px]">
                    <Sparkles className="h-3 w-3" /> ИИ распределит вас в нужную службу автоматически.
                  </p>
                </div>
              </>
            )}
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Пароль</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Подождите…" : mode === "in" ? "Войти" : "Создать аккаунт"}
            </Button>
          </form>
          <button
            onClick={() => setMode(mode === "in" ? "up" : "in")}
            className="text-muted-foreground hover:text-foreground mt-4 w-full text-center text-sm"
          >
            {mode === "in" ? "Нет аккаунта? Регистрация рабочего" : "Уже есть аккаунт? Войти"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Signed in but not a worker yet — collect department + enroll.
function WorkerEnroll({ onDone }: { onDone: () => Promise<void> }) {
  const classify = useServerFn(classifyDepartment);
  const [dept, setDept] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dept.trim()) return;
    setLoading(true);
    try {
      await enrollWorker(dept, classify);
      toast.success("Профиль рабочего создан");
      await onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="bg-card rounded-2xl border p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Завершите регистрацию рабочего</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Опишите свой отдел — ИИ определит, какие задачи вам показывать.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label>Ваш отдел / сфера деятельности</Label>
              <Textarea
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                rows={3}
                placeholder="Например: Водоканал, ремонт дорог, электрики-сетевики…"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "ИИ распределяет…" : "Привязать к службе"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

type ClassifyFn = ReturnType<typeof useServerFn<typeof classifyDepartment>>;

async function enrollWorker(text: string, classify: ClassifyFn) {
  const verdict = await classify({ data: { text } });
  const { data: svc, error: svcErr } = await supabase
    .from("services")
    .select("id, name_ru")
    .eq("code", verdict.category)
    .maybeSingle();
  if (svcErr || !svc) throw new Error("Не удалось определить службу");
  const { data: ures } = await supabase.auth.getUser();
  const uid = ures.user?.id;
  if (!uid) throw new Error("Нет сессии");
  const { error } = await supabase.from("user_roles").insert({
    user_id: uid,
    role: "worker",
    service_id: svc.id,
    department_text: text,
  });
  if (error && !/duplicate|unique/i.test(error.message)) throw error;
  toast.success(`ИИ распределил вас в: ${svc.name_ru}`);
}

// ---------------- Kanban for the worker ----------------

const COLUMNS: { key: ReportStatus; label: string; tone: string }[] = [
  { key: "approved", label: "Одобрено Акиматом", tone: "border-indigo-500/40" },
  { key: "in_progress", label: "В процессе", tone: "border-amber-500/40" },
  { key: "awaiting_confirmation", label: "Ожидает проверки", tone: "border-purple-500/40" },
];

function WorkerKanban({ serviceId }: { serviceId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["worker-kanban", serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("service_id", serviceId)
        .in("status", ["approved", "in_progress", "awaiting_confirmation"])
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReportRow[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["worker-kanban"] });

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-bold">Канбан задач бригады</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Вы видите только заявки, одобренные Акиматом и привязанные к вашей сфере.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const items = (data ?? []).filter((r) => r.status === col.key);
            return (
              <div key={col.key} className={`bg-card rounded-2xl border-t-4 ${col.tone} border-x border-b p-4`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wide">{col.label}</h3>
                  <span className="text-muted-foreground text-xs">{items.length}</span>
                </div>
                <div className="mt-3 space-y-3">
                  {!items.length && (
                    <div className="text-muted-foreground rounded-lg border border-dashed py-8 text-center text-xs">
                      Пусто
                    </div>
                  )}
                  {items.map((r) => (
                    <KanbanCard key={r.id} report={r} onChanged={refresh} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KanbanCard({ report, onChanged }: { report: ReportRow; onChanged: () => void }) {
  const { user } = useAuth();
  const [comment, setComment] = useState(report.completion_comment ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const take = async () => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status: "in_progress", assigned_to: user!.id, taken_at: new Date().toISOString() })
        .eq("id", report.id);
      if (error) throw error;
      await supabase.from("report_history").insert({
        report_id: report.id,
        actor_id: user!.id,
        action: "take",
        from_status: report.status,
        to_status: "in_progress",
      });
      toast.success("Взято в работу");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  const sendCheck = async () => {
    if (!file && !report.completion_photo_url) {
      toast.error("Загрузите фото 'После'");
      return;
    }
    if (!comment.trim()) {
      toast.error("Опишите выполненную работу");
      return;
    }
    setBusy(true);
    try {
      let path = report.completion_photo_url;
      if (file) path = (await uploadReportPhoto(file, "completion")) ?? path;
      const { error } = await supabase
        .from("reports")
        .update({
          status: "awaiting_confirmation",
          awaiting_at: new Date().toISOString(),
          completion_comment: comment,
          completion_photo_url: path,
        })
        .eq("id", report.id);
      if (error) throw error;
      await supabase.from("report_history").insert({
        report_id: report.id,
        actor_id: user!.id,
        action: "send_check",
        from_status: report.status,
        to_status: "awaiting_confirmation",
        comment,
      });
      toast.success("Отправлено на проверку");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  };

  const canComplete = (!!file || !!report.completion_photo_url) && comment.trim().length > 0;

  return (
    <div className="bg-background rounded-xl border p-3 text-sm shadow-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge status={report.status} />
        <PriorityBadge priority={report.priority} />
        <span className="text-muted-foreground ml-auto text-[10px]">#{report.id.slice(0, 6)}</span>
      </div>
      <SignedImage path={report.photo_url} alt="" className="mt-2 h-28 w-full rounded-lg object-cover" />
      <p className="mt-2 line-clamp-3 text-xs">{report.description}</p>
      <p className="text-muted-foreground mt-1 text-[10px]">
        {report.address ?? `${report.lat.toFixed(3)}, ${report.lng.toFixed(3)}`}
      </p>

      {report.status === "approved" && (
        <Button size="sm" className="mt-3 w-full" onClick={take} disabled={busy}>
          Взять группой
        </Button>
      )}

      {report.status === "in_progress" && (
        <div className="mt-3 space-y-2">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Отчёт: что сделано (например: 'Труба заменена, течь устранена')"
          />
          <label className="bg-secondary text-secondary-foreground flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed py-2 text-xs">
            <Camera className="h-3.5 w-3.5" />
            {file ? file.name.slice(0, 24) : "Загрузить фото 'После'"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <Button
            size="sm"
            className="w-full"
            onClick={sendCheck}
            disabled={busy || !canComplete}
          >
            {canComplete ? "Завершить работу" : <><Lock className="mr-1 h-3 w-3" /> Загрузите фото и отчёт</>}
          </Button>
        </div>
      )}

      {report.status === "awaiting_confirmation" && (
        <div className="bg-secondary/50 mt-3 rounded-lg p-2 text-xs">
          Ожидает подтверждения акимата.
          {report.completion_comment && <p className="text-muted-foreground mt-1 italic">«{report.completion_comment}»</p>}
          {report.completion_photo_url && (
            <SignedImage path={report.completion_photo_url} alt="after" className="mt-2 h-20 w-full rounded object-cover" />
          )}
        </div>
      )}
    </div>
  );
}