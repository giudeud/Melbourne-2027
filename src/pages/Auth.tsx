import { useState, type FormEvent } from 'react';
import { auth, backendMode, type AppUser } from '../lib/backend';
import { Button, Field, Input } from '../components/ui';
import { MelbourneSkyline } from '../components/Skyline';

export default function AuthScreen({ onAuth }: { onAuth: (u: AppUser) => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (password.length < 6) return setErr('A senha precisa ter ao menos 6 caracteres.');
    setBusy(true);
    try {
      const u = mode === 'signup' ? await auth.signUp(name || email.split('@')[0], email, password) : await auth.signIn(email, password);
      onAuth(u);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-[#F1EFEA] border-r border-line overflow-hidden">
        <div className="p-10">
          <p className="font-bold tracking-tight text-xl">MELBOURNE ’27</p>
          <p className="text-sm text-ink-muted">Work &amp; Holiday / Au Pair</p>
        </div>
        <MelbourneSkyline className="w-full h-auto" />
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <div className="lg:hidden mb-6">
            <p className="font-bold tracking-tight text-xl">MELBOURNE ’27</p>
            <p className="text-sm text-ink-muted">Work &amp; Holiday / Au Pair</p>
          </div>
          <div>
            <h1 className="text-xl font-semibold">{mode === 'signin' ? 'Entrar' : 'Criar conta'}</h1>
            <p className="text-sm text-ink-muted mt-1">
              {backendMode === 'supabase'
                ? 'Seus dados ficam sincronizados na nuvem (Supabase).'
                : 'Modo local: a conta e os dados ficam salvos neste navegador. Configure o Supabase para sincronizar entre dispositivos.'}
            </p>
          </div>
          {mode === 'signup' && (
            <Field label="Nome">
              <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </Field>
          )}
          <Field label="E-mail">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>
          <Field label="Senha">
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
          </Field>
          {err && <p className="text-sm text-crit">{err}</p>}
          <Button type="submit" variant="primary" className="w-full" disabled={busy}>
            {busy ? 'Aguarde…' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
          </Button>
          <p className="text-sm text-ink-muted text-center">
            {mode === 'signin' ? 'Primeiro acesso?' : 'Já tem conta?'}{' '}
            <button type="button" className="text-ink font-medium underline underline-offset-2" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setErr(null); }}>
              {mode === 'signin' ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
