import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { MapPicker } from "@/components/MapPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { uploadReportPhoto, getSignedUrl } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { analyzeReport } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { MapPin, Camera, Loader2 } from "lucide-react";

export const Route = createFileRoute("/report/new")({
  head: () => ({ meta: [{ title: "Новое обращение — Smart City" }] }),
  component: NewReport,
});

function NewReport() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeReport);

  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [anonName, setAnonName] = useState("");
  const [anonPhone, setAnonPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pos) {
      toast.error(t("report.new.locationHint"));
      return;
    }
    if (!description.trim()) {
      toast.error(t("common.required"));
      return;
    }
    setLoading(true);
    try {
      // 0) Always read the freshest authenticated user at submit-time,
      //    so we don't store created_by = null due to a stale context.
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id ?? user?.id ?? null;

      // 1) upload photo
      let photoPath: string | null = null;
      if (file) photoPath = await uploadReportPhoto(file);
      const signed = photoPath ? await getSignedUrl(photoPath) : null;

      // 2) AI analyze
      const verdict = await analyze({
        data: {
          description,
          address: address || undefined,
          photoUrl: signed ?? undefined,
        },
      });

      // 3) Find service id by category
      const { data: svc } = await supabase
        .from("services")
        .select("id")
        .eq("code", verdict.category)
        .maybeSingle();

      // 4) Insert report
      const { data: inserted, error } = await supabase
        .from("reports")
        .insert({
          created_by: currentUserId,
          anon_name: currentUserId ? null : anonName || null,
          anon_phone: currentUserId ? null : anonPhone || null,
          description,
          photo_url: photoPath,
          lat: pos.lat,
          lng: pos.lng,
          address: address || null,
          status: "new",
          category: verdict.category,
          priority: verdict.priority,
          service_id: svc?.id ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;

      // 5) Save AI analysis (best-effort)
      if (inserted) {
        await supabase.from("ai_analysis").insert({
          report_id: inserted.id,
          category: verdict.category,
          priority: verdict.priority,
          service_code: verdict.category,
          reason: verdict.reason,
          solution: verdict.solution,
          raw: verdict as unknown as never,
        });
      }

      toast.success(t("report.new.success"), { description: t("report.new.successDesc") });
      navigate({ to: "/my-reports" });
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-bold">{t("report.new.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("report.new.subtitle")}</p>

        <form onSubmit={submit} className="mt-8 space-y-6">
          <div>
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {t("report.new.location")}
            </Label>
            <p className="text-muted-foreground mb-2 text-xs">{t("report.new.locationHint")}</p>
            <MapPicker value={pos} onChange={setPos} />
            {pos && (
              <div className="text-muted-foreground mt-2 text-xs">
                {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
              </div>
            )}
          </div>

          <div>
            <Label>{t("report.new.address")}</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={500} />
          </div>

          <div>
            <Label>{t("report.new.description")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={4000}
              placeholder={t("report.new.descriptionPh")}
              required
            />
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Camera className="h-4 w-4" /> {t("report.new.photo")}
            </Label>
            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>

          {!user && (
            <div className="bg-secondary/50 grid gap-4 rounded-xl border p-4 md:grid-cols-2">
              <div>
                <Label>{t("report.new.anonName")}</Label>
                <Input value={anonName} onChange={(e) => setAnonName(e.target.value)} maxLength={120} />
              </div>
              <div>
                <Label>{t("report.new.anonPhone")}</Label>
                <Input value={anonPhone} onChange={(e) => setAnonPhone(e.target.value)} maxLength={40} />
              </div>
            </div>
          )}

          <Button type="submit" size="lg" disabled={loading} className="w-full md:w-auto">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("report.new.submitting")}
              </>
            ) : (
              t("report.new.submit")
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}