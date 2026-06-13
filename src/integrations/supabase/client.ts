import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

function readEnv(key: string): string | undefined {
  // Browser: only import.meta.env is safe — `process` is undefined.
  const viteVal = (import.meta.env as Record<string, string | undefined>)[`VITE_${key}`];
  if (viteVal) return viteVal;
  // Server (SSR) only: process exists; fall back to unprefixed name.
  if (typeof process !== 'undefined' && process.env) {
    return (process.env as Record<string, string | undefined>)[key];
  }
  return undefined;
}

function createSupabaseClient(): SupabaseClient<Database> {
  const SUPABASE_URL = readEnv('SUPABASE_URL');
  const SUPABASE_PUBLISHABLE_KEY = readEnv('SUPABASE_PUBLISHABLE_KEY');

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ['VITE_SUPABASE_URL'] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ['VITE_SUPABASE_PUBLISHABLE_KEY'] : []),
    ];
    throw new Error(`Missing Supabase environment variable(s): ${missing.join(', ')}.`);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: SupabaseClient<Database> | undefined;
let _initError: Error | undefined;

function getClientOrThrow(): SupabaseClient<Database> {
  if (_supabase) return _supabase;
  if (_initError) throw _initError;
  try {
    _supabase = createSupabaseClient();
    return _supabase;
  } catch (err) {
    _initError = err instanceof Error ? err : new Error(String(err));
    console.error('[Supabase]', _initError.message);
    throw _initError;
  }
}

// Lazy Proxy: never throws on property access — only when a method is actually
// invoked. This keeps render-time references safe (e.g. AuthProvider effect
// setup) and surfaces failures as caught promise rejections instead.
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, _receiver) {
    try {
      const client = getClientOrThrow();
      const value = (client as unknown as Record<string | symbol, unknown>)[prop as string];
      return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(client) : value;
    } catch (err) {
      // For known sub-namespaces, return a stub so chained access doesn't throw
      // synchronously during render; only actual method calls reject.
      if (prop === 'auth' || prop === 'storage' || prop === 'realtime' || prop === 'functions') {
        return makeRejectingNamespace(err);
      }
      if (prop === 'from' || prop === 'rpc' || prop === 'channel' || prop === 'removeChannel' || prop === 'removeAllChannels') {
        return () => makeRejectingBuilder(err);
      }
      throw err;
    }
  },
});

function makeRejectingNamespace(err: unknown): unknown {
  return new Proxy(
    {},
    {
      get() {
        return (..._args: unknown[]) => {
          // Methods return a rejected promise; subscriptions return a noop.
          const p = Promise.reject(err);
          // Attach a fake `data.subscription.unsubscribe` for onAuthStateChange-like shapes.
          (p as unknown as { data?: unknown }).data = { subscription: { unsubscribe: () => {} } };
          return p;
        };
      },
    },
  );
}

function makeRejectingBuilder(err: unknown): unknown {
  const chain: unknown = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'then') return (resolve: (v: unknown) => void) => resolve({ data: null, error: err });
        return () => chain;
      },
    },
  );
  return chain;
}
