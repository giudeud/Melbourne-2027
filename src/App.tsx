import { useEffect, useState, type ComponentType } from 'react';
import clsx from 'clsx';
import {
  BookOpen,
  CalendarDays,
  Check,
  CloudOff,
  FileText,
  Home,
  KanbanSquare,
  ListChecks,
  Loader2,
  LogOut,
  Menu,
  Plane,
  Settings as SettingsIcon,
  Timer,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useStore } from './store/Store';
import Overview from './pages/Overview';
import MyTasks from './pages/MyTasks';
import Kanban from './pages/Kanban';
import Sprints from './pages/Sprints';
import Documents from './pages/Documents';
import Finance from './pages/Finance';
import VisaPage from './pages/Visa';
import AuPair from './pages/AuPair';
import CalendarPage from './pages/Calendar';
import Notes from './pages/Notes';
import SettingsPage from './pages/Settings';
import { fmtDateTime } from './lib/utils';

export type RouteId =
  | 'overview'
  | 'tasks'
  | 'kanban'
  | 'sprints'
  | 'documents'
  | 'finance'
  | 'visa'
  | 'aupair'
  | 'calendar'
  | 'notes'
  | 'settings';

const NAV: { id: RouteId; label: string; icon: LucideIcon; page: ComponentType }[] = [
  { id: 'overview', label: 'Overview', icon: Home, page: Overview },
  { id: 'tasks', label: 'My Tasks', icon: ListChecks, page: MyTasks },
  { id: 'kanban', label: 'Kanban Board', icon: KanbanSquare, page: Kanban },
  { id: 'sprints', label: 'Sprints', icon: Timer, page: Sprints },
  { id: 'documents', label: 'Documents', icon: FileText, page: Documents },
  { id: 'finance', label: 'Financial Tracker', icon: Wallet, page: Finance },
  { id: 'visa', label: 'Visa Tracker', icon: Plane, page: VisaPage },
  { id: 'aupair', label: 'Au Pair / AIFS', icon: Users, page: AuPair },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, page: CalendarPage },
  { id: 'notes', label: 'Notes & Logs', icon: BookOpen, page: Notes },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, page: SettingsPage },
];

const readRoute = (): RouteId => {
  const h = window.location.hash.replace(/^#\/?/, '') as RouteId;
  return NAV.some((n) => n.id === h) ? h : 'overview';
};

function SaveIndicator() {
  const { saveState, saveError, lastSaved } = useStore();
  if (saveState === 'saving')
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted">
        <Loader2 size={12} className="animate-spin" /> Salvando…
      </span>
    );
  if (saveState === 'error')
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-crit" title={saveError ?? ''}>
        <CloudOff size={12} /> Erro ao salvar
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-faint" title={lastSaved ? `Último salvamento: ${fmtDateTime(lastSaved)}` : ''}>
      <Check size={12} className="text-ok" /> Salvo automaticamente
    </span>
  );
}

export default function App({ onSignOut }: { onSignOut: () => void }) {
  const { user } = useStore();
  const [route, setRoute] = useState<RouteId>(readRoute);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => {
      setRoute(readRoute());
      setOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const Page = NAV.find((n) => n.id === route)!.page;

  const sidebar = (
    <nav className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-5">
        <a href="#/overview" className="block">
          <p className="font-bold tracking-tight text-[17px]">MELBOURNE ’27</p>
          <p className="text-[11px] text-ink-muted mt-0.5">Work &amp; Holiday / Au Pair</p>
        </a>
      </div>
      <ul className="px-3 space-y-0.5 flex-1 overflow-y-auto">
        {NAV.map((n) => (
          <li key={n.id}>
            <a
              href={`#/${n.id}`}
              className={clsx(
                'flex items-center gap-2.5 h-8 px-2.5 rounded-md text-[13.5px] transition-colors',
                route === n.id ? 'bg-stone-200/70 text-ink font-medium' : 'text-ink-soft hover:bg-stone-100',
              )}
            >
              <n.icon size={15} className={route === n.id ? 'text-ink' : 'text-ink-muted'} />
              {n.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="px-4 py-4 border-t border-line space-y-2">
        <SaveIndicator />
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[13px] font-medium truncate">{user.name || 'Minha conta'}</p>
            <p className="text-[11px] text-ink-faint truncate">{user.email}</p>
          </div>
          <button onClick={onSignOut} className="p-1.5 rounded-md text-ink-muted hover:bg-stone-100" title="Sair" aria-label="Sair">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-paper text-ink">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-60 border-r border-line bg-[#F6F5F2]">{sidebar}</aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-line bg-paper/90 backdrop-blur">
        <button onClick={() => setOpen(true)} className="p-2 -ml-2" aria-label="Abrir menu">
          <Menu size={20} />
        </button>
        <span className="font-bold tracking-tight">MELBOURNE ’27</span>
        <span className="w-8" />
      </header>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-[#F6F5F2] shadow-lift">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-5 p-1.5" aria-label="Fechar menu">
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="lg:pl-60">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
          <Page />
        </div>
      </main>
    </div>
  );
}
