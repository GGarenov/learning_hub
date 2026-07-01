import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { isSupabaseConfigured, supabase } from "./supabase";
import {
  cancelPendingSave,
  debouncedSaveProgress,
  flushPendingSave,
  hasProgressData,
  loadProgress,
  saveProgress,
  serializeAppState,
  subscribeSyncStatus,
  getSyncStatus,
  getLastSyncedAt,
  type SyncStatus,
} from "./progress-sync";
import { useAppStore } from "./store";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  uploadLocalToCloud: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured());
  const [syncStatus, setSyncStatusState] = useState<SyncStatus>(getSyncStatus());
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(getLastSyncedAt());
  const hydratingRef = useRef(false);
  const storeUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return subscribeSyncStatus(() => {
      setSyncStatusState(getSyncStatus());
      setLastSyncedAt(getLastSyncedAt());
    });
  }, []);

  const stopStoreSync = useCallback(() => {
    storeUnsubRef.current?.();
    storeUnsubRef.current = null;
    cancelPendingSave();
  }, []);

  const startStoreSync = useCallback(
    (userId: string) => {
      stopStoreSync();

      let snapshot = JSON.stringify(serializeAppState(useAppStore.getState() as Record<string, unknown>));

      storeUnsubRef.current = useAppStore.subscribe((state) => {
        if (hydratingRef.current) return;
        const next = serializeAppState(state as Record<string, unknown>);
        const encoded = JSON.stringify(next);
        if (encoded === snapshot) return;
        snapshot = encoded;
        debouncedSaveProgress(userId, next);
      });
    },
    [stopStoreSync],
  );

  const hydrateFromCloud = useCallback(
    async (userId: string) => {
      hydratingRef.current = true;
      try {
        const cloud = await loadProgress(userId);
        const local = serializeAppState(useAppStore.getState() as Record<string, unknown>);

        if (cloud) {
          // Cloud wins when both exist (v1 conflict strategy).
          useAppStore.getState().importState(cloud);
          toast.success("Loaded progress from cloud");
        } else if (hasProgressData(local)) {
          await saveProgress(userId, local);
          toast.success("Uploaded local progress to cloud");
        }
      } catch {
        toast.error("Could not sync progress. Using local data.");
      } finally {
        hydratingRef.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      stopStoreSync();
      return;
    }

    let cancelled = false;

    (async () => {
      await hydrateFromCloud(user.id);
      if (!cancelled) startStoreSync(user.id);
    })();

    return () => {
      cancelled = true;
      void flushPendingSave();
      stopStoreSync();
    };
  }, [user?.id, hydrateFromCloud, startStoreSync, stopStoreSync]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await flushPendingSave();
    stopStoreSync();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Keep local cache on logout so the app remains usable offline.
  }, [stopStoreSync]);

  const uploadLocalToCloud = useCallback(async () => {
    if (!user?.id) throw new Error("Sign in to upload progress");
    const local = serializeAppState(useAppStore.getState() as Record<string, unknown>);
    await saveProgress(user.id, local);
    toast.success("Local progress uploaded to cloud");
  }, [user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      configured: isSupabaseConfigured(),
      syncStatus,
      lastSyncedAt,
      signIn,
      signUp,
      signOut,
      uploadLocalToCloud,
    }),
    [user, session, loading, syncStatus, lastSyncedAt, signIn, signUp, signOut, uploadLocalToCloud],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
