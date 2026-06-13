import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Вход — Smart City AI Dispatcher" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useI18n();
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let session = null;
      if (mode === "up") {
        const { data: signUp, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, phone },
            emailRedirectTo:
              typeof window !== "undefined" ? window.location.origin : undefined,
          },
        });
        if (error) throw error;
        session = signUp.session;
        // If email confirmation is enabled, signUp returns no session —
        // try a direct sign-in; if that also fails, the user must confirm email.
        if (!session) {
          const { data: signIn, error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInErr) {
            toast.info("Аккаунт создан. Подтвердите email по ссылке из письма, затем войдите.");
            return;
          }
          session = signIn.session;
        }
        toast.success(t("auth.success.signUp"));
      } else {
        const { data: signIn, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        session = signIn.session;
        toast.success(t("auth.success.signIn"));
      }

      if (!session) {
        throw new Error("Не удалось создать сессию. Попробуйте войти ещё раз.");
      }

      // Sync global auth state before navigating
      await refresh();

      // Role-based redirect into the user's cabinet
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      const userRoles = (roleRows ?? []).map((r) => r.role as string);
      if (userRoles.includes("admin")) navigate({ to: "/admin" });
      else if (userRoles.includes("worker")) navigate({ to: "/worker" });
      else navigate({ to: "/my-reports" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="bg-card rounded-2xl border p-8 shadow-sm">
          <h1 className="text-2xl font-bold">{mode === "in" ? t("auth.signIn") : t("auth.signUp")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("app.tagline")}</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "up" && (
              <>
                <div>
                  <Label>{t("auth.fullName")}</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div>
                  <Label>{t("auth.phone")}</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </>
            )}
            <div>
              <Label>{t("auth.email")}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>{t("auth.password")}</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("common.loading") : mode === "in" ? t("auth.submit.signIn") : t("auth.submit.signUp")}
            </Button>
          </form>
          <button
            onClick={() => setMode(mode === "in" ? "up" : "in")}
            className="text-muted-foreground hover:text-foreground mt-4 w-full text-center text-sm"
          >
            {mode === "in" ? t("auth.switch.toSignUp") : t("auth.switch.toSignIn")}
          </button>
        </div>
      </div>
    </div>
  );
}