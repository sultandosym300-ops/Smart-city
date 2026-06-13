import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type Role = "citizen" | "worker" | "admin";

interface AuthState {
  user: User | null;
  loading: boolean;
  roles: Role[];
  serviceId: string | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthState>({
  user: null,
  loading: true,
  roles: [],
  serviceId: null,
  signOut: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [serviceId, setServiceId] = useState<string | null>(null);

  const loadRoles = async (uid: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role, service_id")
      .eq("user_id", uid);
    if (data) {
      setRoles(data.map((r) => r.role as Role));
      const worker = data.find((r) => r.role === "worker" && r.service_id);
      setServiceId(worker?.service_id ?? null);
    } else {
      setRoles([]);
      setServiceId(null);
    }
  };

  const refresh = async () => {
    const { data } = await supabase.auth.getSession();
    const u = data.session?.user ?? null;
    setUser(u);
    if (u) await loadRoles(u.id);
    else {
      setRoles([]);
      setServiceId(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;
    (async () => {
      try {
        await refresh();
      } catch (err) {
        console.error('[auth] refresh failed', err);
      }
      if (mounted) setLoading(false);
    })();
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          // defer to avoid deadlock
          setTimeout(() => {
            loadRoles(u.id).catch((e) => console.error('[auth] loadRoles failed', e));
          }, 0);
        } else {
          setRoles([]);
          setServiceId(null);
        }
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    } catch (err) {
      console.error('[auth] onAuthStateChange setup failed', err);
    }
    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRoles([]);
    setServiceId(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, roles, serviceId, signOut, refresh }}>{children}</Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);