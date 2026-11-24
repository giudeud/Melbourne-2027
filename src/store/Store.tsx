import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AppData } from '../types';
import { buildSeed } from '../data/seed';
import { db, type AppUser } from '../lib/backend';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface StoreValue {
  data: AppData;
  user: AppUser;
  update: (fn: (d: AppData) => AppData) => void;
  replaceAll: (d: AppData) => void;
  saveState: SaveState;
  saveError: string | null;
  lastSaved: string | null;
}

const Ctx = createContext<StoreValue | null>(null);

/** Fill in any keys missing from older saves so the app never crashes on upgrade. */
export function normalize(d: Partial<AppData>): AppData {
  const seed = buildSeed();
  return {
    ...seed,
    ...d,
    finance: { ...seed.finance, ...(d.finance ?? {}), rate: { ...seed.finance.rate, ...(d.finance?.rate ?? {}) } },
    visa: { ...seed.visa, ...(d.visa ?? {}) },
    aupair: { ...seed.aupair, ...(d.aupair ?? {}) },
    settings: { ...seed.settings, ...(d.settings ?? {}) },
    tasks: (d.tasks ?? seed.tasks).map((t) => ({ ...t, checklist: t.checklist ?? [], attachments: t.attachments ?? [] })),
    documents: (d.documents ?? seed.documents).map((x) => ({
      ...x,
      translationSteps: x.translationSteps ?? { quote: false, sent: false, received: false, reviewed: false, stored: false },
    })),
  } as AppData;
}

export function StoreProvider({ user, children }: { user: AppUser; children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const pending = useRef<AppData | null>(null);

  useEffect(() => {
    let alive = true;
    db.load(user.id)
      .then(async (loaded) => {
        if (!alive) return;
        if (loaded) {
          setData(normalize(loaded));
          setLastSaved(loaded.updatedAt ?? null);
        } else {
          const seed = buildSeed();
          seed.settings.userName = user.name;
          setData(seed);
          await db.save(user.id, seed);
          setLastSaved(seed.updatedAt);
        }
      })
      .catch((e) => alive && setLoadError(String(e?.message ?? e)));
    return () => {
      alive = false;
    };
  }, [user.id, user.name]);

  const flush = useCallback(async () => {
    const d = pending.current;
    if (!d) return;
    pending.current = null;
    setSaveState('saving');
    try {
      await db.save(user.id, d);
      setSaveState('saved');
      setSaveError(null);
      setLastSaved(d.updatedAt);
    } catch (e: unknown) {
      setSaveState('error');
      setSaveError(e instanceof Error ? e.message : String(e));
      pending.current = pending.current ?? d; // retry on next change
    }
  }, [user.id]);

  const schedule = useCallback(
    (d: AppData) => {
      pending.current = d;
      setSaveState('saving');
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, 500);
    },
    [flush],
  );

  useEffect(() => {
    const onUnload = () => {
      if (pending.current) void flush();
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [flush]);

  const update = useCallback(
    (fn: (d: AppData) => AppData) => {
      setData((prev) => {
        if (!prev) return prev;
        const next = { ...fn(prev), updatedAt: new Date().toISOString() };
        schedule(next);
        return next;
      });
    },
    [schedule],
  );

  const replaceAll = useCallback(
    (d: AppData) => {
      const next = { ...normalize(d), updatedAt: new Date().toISOString() };
      setData(next);
      schedule(next);
    },
    [schedule],
  );

  if (loadError)
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="max-w-md text-center">
          <p className="font-semibold">Não foi possível carregar seus dados.</p>
          <p className="text-sm text-ink-muted mt-2">{loadError}</p>
        </div>
      </div>
    );
  if (!data)
    return (
      <div className="min-h-screen grid place-items-center text-sm text-ink-muted">Carregando…</div>
    );

  return (
    <Ctx.Provider value={{ data, user, update, replaceAll, saveState, saveError, lastSaved }}>{children}</Ctx.Provider>
  );
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside provider');
  return v;
}
