import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Brain, MapPin, GitBranch, ArrowRight, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart City AI Dispatcher — Городской ИИ-диспетчер" },
      { name: "description", content: "Платформа обращений граждан с ИИ-классификацией: жители, городские службы, акимат — в одной системе." },
      { property: "og:title", content: "Smart City AI Dispatcher" },
      { property: "og:description", content: "ИИ-диспетчер обращений граждан для умного города." },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useI18n();
  const { data: stats } = useQuery({
    queryKey: ["home-stats"],
    queryFn: async () => {
      const { data } = await supabase.from("reports").select("status, priority");
      const total = data?.length ?? 0;
      const high = data?.filter((r) => r.priority === "high").length ?? 0;
      const done = data?.filter((r) => r.status === "completed").length ?? 0;
      const inProgress = data?.filter((r) => r.status === "in_progress").length ?? 0;
      return { total, high, done, inProgress };
    },
  });

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, oklch(0.82 0.16 85) 0, transparent 40%), radial-gradient(circle at 80% 60%, oklch(0.68 0.16 160) 0, transparent 45%)",
        }} />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28">
          <div className="text-primary-foreground/80 mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> AI-powered • Gemini
          </div>
          <h1 className="text-primary-foreground max-w-3xl text-5xl font-bold leading-tight md:text-6xl">
            {t("home.title")}
          </h1>
          <p className="text-primary-foreground/85 mt-5 max-w-2xl text-lg md:text-xl">
            {t("home.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/report/new">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
                {t("home.cta.report")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Brain, k: "ai" as const },
            { icon: MapPin, k: "map" as const },
            { icon: GitBranch, k: "workflow" as const },
          ].map(({ icon: Icon, k }) => (
            <div key={k} className="bg-card rounded-2xl border p-6 shadow-sm transition hover:shadow-md">
              <div className="bg-primary/10 text-primary mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{t(`home.feature.${k}.title` as const)}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{t(`home.feature.${k}.desc` as const)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <h2 className="mb-6 text-2xl font-bold">{t("home.stats.title")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t("admin.stats.total"), value: stats?.total ?? "—", tone: "primary" },
            { label: t("admin.stats.high"), value: stats?.high ?? "—", tone: "destructive" },
            { label: t("admin.stats.inProgress"), value: stats?.inProgress ?? "—", tone: "accent" },
            { label: t("admin.stats.done"), value: stats?.done ?? "—", tone: "success" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border p-5">
              <div className="text-muted-foreground text-xs font-medium uppercase">{s.label}</div>
              <div className="mt-2 text-3xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
