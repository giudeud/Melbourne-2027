import { useMemo, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Circle, CircleDashed, ListTodo, Plane } from 'lucide-react';
import { useStore } from '../store/Store';
import { stats, setTaskStatus } from '../lib/tasks';
import { CATEGORIES } from '../lib/constants';
import { daysUntil, fmtDate, fmtMoney, pct, relativeDue } from '../lib/utils';
import { Badge, Card, CategoryTag, PriorityBadge, Progress, SectionTitle } from '../components/ui';
import { MelbourneSkyline } from '../components/Skyline';
import { TaskModal } from '../components/TaskModal';
import type { Task } from '../types';

function Stat({ label, value, icon, tone, href }: { label: string; value: string | number; icon: ReactNode; tone?: 'ok' | 'warn' | 'crit'; href: string }) {
  return (
    <a href={href} className="block">
      <Card className="p-4 hover:border-ink-faint transition-colors h-full">
        <div className="flex items-center justify-between text-ink-muted">
          <span className="text-xs font-medium">{label}</span>
          <span className={clsx(tone === 'ok' && 'text-ok', tone === 'warn' && 'text-warn', tone === 'crit' && 'text-crit')}>{icon}</span>
        </div>
        <p className="text-2xl font-semibold mt-2 tabular-nums">{value}</p>
      </Card>
    </a>
  );
}

export default function Overview() {
  const { data, update } = useStore();
  const [editing, setEditing] = useState<Task | null>(null);
  const s = stats(data.tasks);
  const days = daysUntil(data.settings.moveDate);

  const upcoming = useMemo(
    () =>
      data.tasks
        .filter((t) => t.status !== 'done' && t.dueDate)
        .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))
        .slice(0, 6),
    [data.tasks],
  );
  const nextDeadlines = data.tasks.filter((t) => t.status !== 'done' && t.dueDate && (daysUntil(t.dueDate) ?? 99) >= 0 && (daysUntil(t.dueDate) ?? 99) <= 14).length;

  const focus = useMemo(
    () =>
      data.tasks
        .filter((t) => t.status === 'in_progress' || (t.status !== 'done' && (t.priority === 'urgent' || (t.dueDate && (daysUntil(t.dueDate) ?? 99) <= 7))))
        .slice(0, 6),
    [data.tasks],
  );

  const activeSprint = data.sprints.find((x) => x.status === 'active');
  const sprintTasks = activeSprint ? data.tasks.filter((t) => t.sprintId === activeSprint.id) : [];
  const sprintPct = pct(sprintTasks.filter((t) => t.status === 'done').length, sprintTasks.length);

  const saved = data.finance.deposits.reduce((a, d) => a + d.amountAud, 0);
  const finPct = pct(saved, data.finance.goalAud);

  const status =
    s.overdue > 0
      ? { label: 'Atenção: há pendências atrasadas', tone: 'crit' as const }
      : data.tasks.some((t) => t.status !== 'done' && t.priority === 'urgent')
        ? { label: 'Em andamento — prioridades urgentes abertas', tone: 'warn' as const }
        : s.progress === 100
          ? { label: 'Concluído', tone: 'ok' as const }
          : { label: 'No prazo', tone: 'ok' as const };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-[#F1EFEA]">
        <div className="h-60 sm:h-56 lg:h-64">
          {data.settings.bannerUrl ? (
            <img src={data.settings.bannerUrl} alt="Melbourne, Austrália" className="w-full h-full object-cover" />
          ) : (
            <MelbourneSkyline className="w-full h-full" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7 text-white flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-[28px] sm:text-4xl font-bold tracking-tight leading-tight">MELBOURNE ’27</h1>
            <p className="text-sm sm:text-base text-white/85">Work &amp; Holiday / Au Pair</p>
          </div>
          <div className="sm:text-right flex sm:block items-baseline gap-2 flex-wrap">
            <p className="text-xs uppercase tracking-wider text-white/75">Mudança estimada</p>
            <p className="font-semibold">{data.settings.moveLabel}</p>
            {days !== null && days > 0 && <p className="text-xs text-white/80">≈ {days} dias</p>}
          </div>
        </div>
      </div>

      {/* Status + progress */}
      <Card className="p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="md:w-72 shrink-0">
            <p className="text-xs text-ink-muted font-medium">Status geral do projeto</p>
            <div className="mt-1.5">
              <Badge tone={status.tone} className="text-xs py-1 px-2">{status.label}</Badge>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-xs text-ink-muted font-medium">Progresso geral</p>
              <p className="text-sm font-semibold tabular-nums">{s.progress}%</p>
            </div>
            <Progress value={s.progress} className="h-2" />
            <p className="text-[11px] text-ink-faint mt-1.5">
              {s.done} de {s.total} tarefas concluídas — calculado automaticamente.
            </p>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <Stat label="Total de tarefas" value={s.total} icon={<ListTodo size={16} />} href="#/tasks" />
        <Stat label="Concluídas" value={s.done} icon={<CheckCircle2 size={16} />} tone="ok" href="#/kanban" />
        <Stat label="Em andamento" value={s.inProgress} icon={<CircleDashed size={16} />} tone="warn" href="#/kanban" />
        <Stat label="Pendentes" value={s.pending} icon={<Circle size={16} />} href="#/kanban" />
        <Stat label="Prazos (14 dias)" value={nextDeadlines} icon={<CalendarClock size={16} />} tone={s.overdue ? 'crit' : undefined} href="#/calendar" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <SectionTitle action={<a href="#/tasks" className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1">Ver tudo <ArrowRight size={12} /></a>}>
              Foco de hoje
            </SectionTitle>
            <Card className="divide-y divide-line">
              {focus.length === 0 && <p className="p-4 text-sm text-ink-faint">Nada urgente. Bom trabalho!</p>}
              {focus.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label={`Concluir ${t.title}`}
                    className="accent-[#3F7D58] h-4 w-4 shrink-0"
                    checked={t.status === 'done'}
                    onChange={() => update((d) => setTaskStatus(d, t.id, t.status === 'done' ? 'todo' : 'done'))}
                  />
                  <button className="flex-1 min-w-0 text-left" onClick={() => setEditing(t)}>
                    <p className="text-sm truncate">{t.title}</p>
                    <CategoryTag c={t.category} />
                  </button>
                  <div className="hidden sm:flex items-center gap-2">
                    {t.status === 'in_progress' && <Badge tone="warn">Em andamento</Badge>}
                    <PriorityBadge p={t.priority} />
                  </div>
                </div>
              ))}
            </Card>
          </div>

          <div>
            <SectionTitle>Próximos prazos</SectionTitle>
            <Card className="divide-y divide-line">
              {upcoming.length === 0 && <p className="p-4 text-sm text-ink-faint">Nenhuma tarefa com prazo definido.</p>}
              {upcoming.map((t) => {
                const n = daysUntil(t.dueDate) ?? 0;
                return (
                  <button key={t.id} onClick={() => setEditing(t)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50">
                    <div className="w-14 shrink-0 text-center">
                      <p className="text-[11px] text-ink-faint uppercase">{fmtDate(t.dueDate, false).split(' ')[1]}</p>
                      <p className="text-lg font-semibold leading-none">{fmtDate(t.dueDate, false).split(' ')[0]}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{t.title}</p>
                      <CategoryTag c={t.category} />
                    </div>
                    <span className={clsx('text-xs whitespace-nowrap', n < 0 ? 'text-crit font-medium' : n <= 7 ? 'text-warn font-medium' : 'text-ink-muted')}>
                      {n < 0 && <AlertTriangle size={12} className="inline mr-1 -mt-0.5" />}
                      {relativeDue(t.dueDate)}
                    </span>
                  </button>
                );
              })}
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          {activeSprint && (
            <div>
              <SectionTitle action={<a href="#/sprints" className="text-xs text-ink-muted hover:text-ink">Sprints</a>}>Sprint ativa</SectionTitle>
              <Card className="p-4">
                <p className="font-medium text-sm">{activeSprint.name}</p>
                <p className="text-xs text-ink-muted mt-1">{activeSprint.periodLabel}</p>
                <div className="flex items-center gap-3 mt-3">
                  <Progress value={sprintPct} />
                  <span className="text-xs font-medium tabular-nums">{sprintPct}%</span>
                </div>
                <p className="text-[11px] text-ink-faint mt-1">{sprintTasks.filter((t) => t.status === 'done').length}/{sprintTasks.length} tarefas</p>
              </Card>
            </div>
          )}

          <div>
            <SectionTitle action={<a href="#/finance" className="text-xs text-ink-muted hover:text-ink">Detalhes</a>}>Reserva financeira</SectionTitle>
            <Card className="p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-lg font-semibold">{fmtMoney(saved, 'AUD')}</p>
                <p className="text-xs text-ink-muted">meta {fmtMoney(data.finance.goalAud, 'AUD')}</p>
              </div>
              <Progress value={finPct} className="mt-3" />
              <p className="text-[11px] text-ink-faint mt-1">{finPct}% da meta</p>
            </Card>
          </div>

          <div>
            <SectionTitle action={<a href="#/visa" className="text-xs text-ink-muted hover:text-ink">Visa Tracker</a>}>Visto 462</SectionTitle>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm inline-flex items-center gap-2"><Plane size={14} className="text-ink-muted" /> Cota Brasil</span>
                <Badge tone={/open|aberta/i.test(data.visa.quotaStatus) ? 'ok' : /paus|closed|fechad/i.test(data.visa.quotaStatus) ? 'warn' : 'neutral'}>{data.visa.quotaStatus || '—'}</Badge>
              </div>
              <p className="text-[11px] text-ink-faint mt-2">Última verificação: {data.visa.lastChecked ? fmtDate(data.visa.lastChecked) : 'não registrada'}</p>
            </Card>
          </div>

          <div>
            <SectionTitle>Por categoria</SectionTitle>
            <Card className="p-4 space-y-3">
              {CATEGORIES.map((c) => {
                const ts = data.tasks.filter((t) => t.category === c.id);
                const p = pct(ts.filter((t) => t.status === 'done').length, ts.length);
                return (
                  <div key={c.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ink-soft">{c.label}</span>
                      <span className="text-ink-faint tabular-nums">{ts.filter((t) => t.status === 'done').length}/{ts.length}</span>
                    </div>
                    <Progress value={p} />
                  </div>
                );
              })}
            </Card>
          </div>
        </div>
      </div>
      {editing && <TaskModal task={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
