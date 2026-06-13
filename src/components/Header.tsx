import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Building2, LogOut, Globe } from "lucide-react";

export function Header() {
  const { user, signOut } = useAuth();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();

  return (
    <header className="bg-card/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-lg">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold">Smart City</div>
            <div className="text-muted-foreground text-[10px] uppercase tracking-wider">
              AI Dispatcher
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/report/new"
            className="hover:bg-secondary rounded-md px-3 py-2 text-sm font-medium"
          >
            {t("nav.new")}
          </Link>
          {user && (
            <Link
              to="/my-reports"
              className="hover:bg-secondary rounded-md px-3 py-2 text-sm font-medium"
            >
              {t("nav.myReports")}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "ru" ? "kk" : "ru")}
            className="text-muted-foreground hover:bg-secondary inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold uppercase"
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === "ru" ? "RU / ҚАЗ" : "ҚАЗ / RU"}
          </button>
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await signOut();
                router.navigate({ to: "/" });
              }}
            >
              <LogOut className="mr-1 h-4 w-4" /> {t("nav.signOut")}
            </Button>
          ) : (
            <Link to="/auth">
              <Button size="sm">{t("nav.signIn")}</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}