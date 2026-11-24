import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import AuthScreen from './pages/Auth';
import { StoreProvider } from './store/Store';
import { auth, supabase, type AppUser } from './lib/backend';

function Root() {
  const [user, setUser] = useState<AppUser | null | undefined>(undefined);

  useEffect(() => {
    auth.currentUser().then(setUser).catch(() => setUser(null));
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email ?? '', name: (u.user_metadata?.name as string) || u.email || '' } : null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (user === undefined) return <div className="min-h-screen grid place-items-center text-sm text-ink-muted">Carregando…</div>;
  if (!user) return <AuthScreen onAuth={setUser} />;
  return (
    <StoreProvider key={user.id} user={user}>
      <App
        onSignOut={async () => {
          await auth.signOut();
          setUser(null);
        }}
      />
    </StoreProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
