import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AppData } from '../types';
import { readFileAsDataURL, sha256, uid } from './utils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export const backendMode: 'supabase' | 'local' = supabase ? 'supabase' : 'local';

export interface AppUser {
  id: string;
  name: string;
  email: string;
}

// ---------------------------------------------------------------------------
// Local mode: per-profile accounts stored in this browser (password hashed).
// ---------------------------------------------------------------------------
interface LocalProfile extends AppUser {
  passHash: string;
}

const LS_PROFILES = 'm27:profiles';
const LS_SESSION = 'm27:session';
const dataKey = (id: string) => `m27:data:${id}`;

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    throw new Error('Não foi possível salvar no navegador (armazenamento cheio ou bloqueado).');
  }
}
function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function localProfiles(): LocalProfile[] {
  try {
    return JSON.parse(safeGet(LS_PROFILES) || '[]');
  } catch {
    return [];
  }
}

export const auth = {
  async currentUser(): Promise<AppUser | null> {
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      return u ? { id: u.id, email: u.email ?? '', name: (u.user_metadata?.name as string) || u.email || '' } : null;
    }
    const id = safeGet(LS_SESSION);
    const p = localProfiles().find((x) => x.id === id);
    return p ? { id: p.id, name: p.name, email: p.email } : null;
  },

  async signUp(name: string, email: string, password: string): Promise<AppUser> {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (error) throw error;
      if (!data.session) throw new Error('Conta criada. Confirme o e-mail enviado pelo Supabase e depois faça login.');
      const u = data.user!;
      return { id: u.id, email: u.email ?? email, name };
    }
    const profiles = localProfiles();
    const norm = email.trim().toLowerCase();
    if (profiles.some((p) => p.email === norm)) throw new Error('Já existe um perfil com este e-mail neste dispositivo.');
    const p: LocalProfile = { id: uid(), name: name.trim(), email: norm, passHash: await sha256(norm + ':' + password) };
    safeSet(LS_PROFILES, JSON.stringify([...profiles, p]));
    safeSet(LS_SESSION, p.id);
    return { id: p.id, name: p.name, email: p.email };
  },

  async signIn(email: string, password: string): Promise<AppUser> {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const u = data.user;
      return { id: u.id, email: u.email ?? email, name: (u.user_metadata?.name as string) || u.email || '' };
    }
    const norm = email.trim().toLowerCase();
    const p = localProfiles().find((x) => x.email === norm);
    if (!p || p.passHash !== (await sha256(norm + ':' + password))) throw new Error('E-mail ou senha incorretos.');
    safeSet(LS_SESSION, p.id);
    return { id: p.id, name: p.name, email: p.email };
  },

  async signOut() {
    if (supabase) await supabase.auth.signOut();
    safeRemove(LS_SESSION);
  },

  async deleteLocalAccount(id: string) {
    safeSet(LS_PROFILES, JSON.stringify(localProfiles().filter((p) => p.id !== id)));
    safeRemove(dataKey(id));
    safeRemove(LS_SESSION);
  },
};

// ---------------------------------------------------------------------------
// Data persistence: one JSON document per user.
// ---------------------------------------------------------------------------
export const db = {
  async load(userId: string): Promise<AppData | null> {
    if (supabase) {
      const { data, error } = await supabase.from('app_state').select('data').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return (data?.data as AppData) ?? null;
    }
    const raw = safeGet(dataKey(userId));
    return raw ? (JSON.parse(raw) as AppData) : null;
  },

  async save(userId: string, data: AppData): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from('app_state')
        .upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
      if (error) throw error;
      return;
    }
    safeSet(dataKey(userId), JSON.stringify(data));
  },

  /** Store a file and return a URL. Supabase Storage in cloud mode, data URL in local mode. */
  async uploadFile(userId: string, file: File): Promise<string> {
    if (supabase) {
      const path = `${userId}/${uid()}-${file.name.replace(/[^\w.-]+/g, '_')}`;
      const { error } = await supabase.storage.from('attachments').upload(path, file);
      if (error) throw error;
      const { data, error: e2 } = await supabase.storage.from('attachments').createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      if (e2) throw e2;
      return data.signedUrl;
    }
    if (file.size > 1.5 * 1024 * 1024)
      throw new Error('No modo local, anexos de arquivo são limitados a 1,5 MB. Use um link (Google Drive, Dropbox…) para arquivos maiores.');
    return readFileAsDataURL(file);
  },
};
