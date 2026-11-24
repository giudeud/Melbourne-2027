import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type { CalendarEvent, EventType, Task } from '../types';
import { useStore } from '../store/Store';
import { EVENT_TYPES } from '../lib/constants';
import { MONTHS_LONG, WEEKDAYS, fmtDate, parseDate, toISODate, todayISO, uid } from '../lib/utils';
import { Button, Card, Empty, Field, Input, Modal, PageHeader, Segmented, Select, Textarea } from '../components/ui';
import { TaskModal } from '../components/TaskModal';
import { navigate } from '../lib/nav';

type Kind = 'task' | 'sprint' | 'document' | 'interview' | 'immigration' | 'exam' | 'travel' | 'other';

interface Item {
  key: string;
  date: string;
  title: string;
  kind: Kind;
  done?: boolean;
  overdue?: boolean;
  onOpen: () => void;
}

const KIND: Record<Kind, { label: string; color: string }> = {
  task: { label: 'Prazos de tarefas', color: '#3F3F46' },
  sprint: { label: 'Sprints', color: '#4B6584' },
  document: { label: 'Documentos', color: '#7C6F64' },
  exam: { label: 'Exames', color: '#7A5C8E' },
  interview: { label: 'Entrevistas', color: '#B7791F' },
  immigration: { label: 'Imigração', color: '#8C5A3C' },
  travel: { label: 'Viagem', color: '#3F7D58' },
  other: { label: 'Outros', color: '#A1A1AA' },
};

function EventModal({ ev, onClose }: { ev: CalendarEvent; onClose: () => void }) {
  const { data, update } = useStore();
  const [e, setE] = useState(ev);
  const isNew = !data.events.some((x) => x.id === e.id);
  const save = () => {
    if (!e.title.trim() || !e.date) return;
    update((d) => ({ ...d, events: isNew ? [...d.events, e] : d.events.map((x) => (x.id === e.id ? e : x)) }));
    onClose();
  };
  const del = () => {
    if (!confirm('Excluir este evento?')) return;
    update((d) => ({ ...d, events: d.events.filter((x) => x.id !== e.id) }));
    onClose();
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? 'Novo evento' : 'Editar evento'}
      footer={
        <>
          {!isNew && <Button variant="danger" className="mr-auto" onClick={del}><Trash2 size={14} /> Excluir</Button>}
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={save} disabled={!e.title.trim() || !e.date}>Salvar</Button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Título" className="sm:col-span-2"><Input autoFocus value={e.title} onChange={(x) => setE({ ...e, title: x.target.value })} /></Field>
        <Field label="Data"><Input type="date" value={e.date} onChange={(x) => setE({ ...e, date: x.target.value })} /></Field>
        <Field label="Tipo">
          <Select value={e.type} onChange={(x) => setE({ ...e, type: x.target.value as EventType })}>
            {EVENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </Select>
        </Field>
        <Field label="Notas" className="sm:col-span-2"><Textarea value={e.notes} onChange={(x) => setE({ ...e, notes: x.target.value })} /></Field>
      </div>
    </Modal>
  );
}

const startOfWeek = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export default function CalendarPage() {
  const { data } = useStore();
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [cursor, setCursor] = useState(() => parseDate(todayISO())!);
  const [hidden, setHidden] = useState<Set<Kind>>(new Set());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const today = todayISO();

  const items = useMemo(() => {
    const out: Item[] = [];
    data.tasks.forEach((t) => {
      if (t.dueDate)
        out.push({ key: 't' + t.id, date: t.dueDate, title: t.title, kind: 'task', done: t.status === 'done', overdue: t.status !== 'done' && t.dueDate < today, onOpen: () => setEditingTask(t) });
    });
    data.sprints.forEach((s) => {
      const short = s.name.split('—')[0].trim();
      if (s.startDate) out.push({ key: 'ss' + s.id, date: s.startDate, title: `Início ${short}`, kind: 'sprint', onOpen: () => navigate('sprints') });
      if (s.endDate) out.push({ key: 'se' + s.id, date: s.endDate, title: `Fim ${short}`, kind: 'sprint', onOpen: () => navigate('sprints') });
    });
    data.documents.forEach((d) => {
      if (d.requestedAt) out.push({ key: 'dr' + d.id, date: d.requestedAt, title: `Solicitado: ${d.name}`, kind: 'document', onOpen: () => navigate('documents') });
      if (d.receivedAt) out.push({ key: 'dv' + d.id, date: d.receivedAt, title: `Recebido: ${d.name}`, kind: 'document', onOpen: () => navigate('documents') });
    });
    data.aupair.families.forEach((f) => {
      if (f.interviewDate) out.push({ key: 'f' + f.id, date: f.interviewDate, title: `Entrevista: ${f.name}`, kind: 'interview', onOpen: () => navigate('aupair') });
    });
    if (data.visa.openDate) out.push({ key: 'vo', date: data.visa.openDate, title: 'Abertura cota 462', kind: 'immigration', onOpen: () => navigate('visa') });
    if (data.visa.closeDate) out.push({ key: 'vc', date: data.visa.closeDate, title: 'Fechamento cota 462', kind: 'immigration', onOpen: () => navigate('visa') });
    data.events.forEach((e) => out.push({ key: 'e' + e.id, date: e.date, title: e.title, kind: e.type as Kind, onOpen: () => setEditingEvent(e) }));
    return out.filter((i) => !hidden.has(i.kind)).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.title.localeCompare(b.title)));
  }, [data, hidden, today]);

  const byDate = useMemo(() => {
    const m = new Map<string, Item[]>();
    items.forEach((i) => m.set(i.date, [...(m.get(i.date) ?? []), i]));
    return m;
  }, [items]);

  const addOn = (date: string) => setEditingEvent({ id: uid(), title: '', date, type: 'other', notes: '' });

  const move = (dir: number) => {
    if (view === 'month') setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
    else if (view === 'week') setCursor(addDays(cursor, dir * 7));
    else setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
  };

  const header =
    view === 'week'
      ? (() => {
          const s = startOfWeek(cursor);
          const e = addDays(s, 6);
          return `${fmtDate(toISODate(s))} – ${fmtDate(toISODate(e))}`;
        })()
      : `${MONTHS_LONG[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const Pill = ({ i, compact }: { i: Item; compact?: boolean }) => (
    <button
      onClick={(e) => { e.stopPropagation(); i.onOpen(); }}
      className={clsx('w-full text-left flex items-center gap-1.5 rounded px-1.5 py-0.5 hover:bg-stone-100', compact ? 'text-[11px]' : 'text-sm', i.done && 'line-through text-ink-faint', i.overdue && 'text-crit')}
      title={i.title}
    >
      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: KIND[i.kind].color }} />
      <span className="truncate">{i.title}</span>
    </button>
  );

  const renderMonth = () => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(first);
    const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
    return (
      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b border-line">
          {WEEKDAYS.map((w) => <div key={w} className="text-[11px] font-medium text-ink-muted px-2 py-2">{w}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, idx) => {
            const iso = toISODate(d);
            const list = byDate.get(iso) ?? [];
            const inMonth = d.getMonth() === cursor.getMonth();
            return (
              <div
                key={iso}
                onClick={() => addOn(iso)}
                className={clsx('min-h-[72px] sm:min-h-[104px] border-line p-1 cursor-pointer hover:bg-stone-50/70', idx % 7 !== 6 && 'border-r', idx < 35 && 'border-b', !inMonth && 'bg-stone-50/60')}
              >
                <div className={clsx('text-[11px] w-6 h-6 grid place-items-center rounded-full mb-0.5', iso === today ? 'bg-ink text-white font-semibold' : inMonth ? 'text-ink-soft' : 'text-ink-faint')}>{d.getDate()}</div>
                <div className="hidden sm:block space-y-0.5">
                  {list.slice(0, 3).map((i) => <Pill key={i.key} i={i} compact />)}
                  {list.length > 3 && <p className="text-[10px] text-ink-faint px-1.5">+{list.length - 3} mais</p>}
                </div>
                <div className="sm:hidden flex flex-wrap gap-0.5 px-1">
                  {list.slice(0, 4).map((i) => <span key={i.key} className="h-1.5 w-1.5 rounded-full" style={{ background: KIND[i.kind].color }} />)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  const renderWeek = () => {
    const s = startOfWeek(cursor);
    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {Array.from({ length: 7 }, (_, i) => addDays(s, i)).map((d) => {
          const iso = toISODate(d);
          const list = byDate.get(iso) ?? [];
          return (
            <Card key={iso} className={clsx('p-2 min-h-[120px] md:min-h-[320px]', iso === today && 'border-ink')}>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-medium text-ink-muted">{WEEKDAYS[d.getDay()]} <span className="text-ink">{d.getDate()}</span></span>
                <button onClick={() => addOn(iso)} className="text-ink-faint hover:text-ink" aria-label="Adicionar evento"><Plus size={13} /></button>
              </div>
              <div className="space-y-0.5">{list.map((i) => <Pill key={i.key} i={i} compact />)}</div>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderList = () => {
    const from = toISODate(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
    const upcoming = items.filter((i) => i.date >= from);
    const groups = new Map<string, Item[]>();
    upcoming.forEach((i) => {
      const k = i.date.slice(0, 7);
      groups.set(k, [...(groups.get(k) ?? []), i]);
    });
    if (!upcoming.length) return <Empty>Nenhum item a partir deste mês.</Empty>;
    return (
      <div className="space-y-5">
        {[...groups.entries()].map(([k, list]) => {
          const [y, m] = k.split('-').map(Number);
          return (
            <div key={k}>
              <p className="text-[13px] font-semibold mb-2">{MONTHS_LONG[m - 1]} {y}</p>
              <Card className="divide-y divide-line">
                {list.map((i) => (
                  <div key={i.key} className="flex items-center gap-3 px-3 py-1.5">
                    <span className={clsx('text-xs w-14 shrink-0 tabular-nums', i.date === today ? 'font-semibold' : 'text-ink-muted')}>{fmtDate(i.date, false)}</span>
                    <div className="flex-1 min-w-0"><Pill i={i} /></div>
                    <span className="text-[11px] text-ink-faint hidden sm:inline">{KIND[i.kind].label}</span>
                  </div>
                ))}
              </Card>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Deadlines & Calendar"
        subtitle="Prazos de tarefas, sprints, documentos, entrevistas, imigração e viagem em um só lugar."
        actions={<Button variant="primary" onClick={() => addOn(today)}><Plus size={15} /> Novo evento</Button>}
      />
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => move(-1)} aria-label="Anterior"><ChevronLeft size={16} /></Button>
          <Button size="sm" onClick={() => setCursor(parseDate(today)!)}>Hoje</Button>
          <Button size="sm" variant="ghost" onClick={() => move(1)} aria-label="Próximo"><ChevronRight size={16} /></Button>
        </div>
        <p className="font-semibold">{header}</p>
        <div className="ml-auto">
          <Segmented value={view} onChange={setView} options={[{ id: 'month', label: 'Mês' }, { id: 'week', label: 'Semana' }, { id: 'list', label: 'Lista' }]} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(KIND) as Kind[]).map((k) => {
          const off = hidden.has(k);
          return (
            <button
              key={k}
              onClick={() => { const n = new Set(hidden); off ? n.delete(k) : n.add(k); setHidden(n); }}
              className={clsx('inline-flex items-center gap-1.5 text-xs rounded-full border px-2.5 py-1 transition-colors', off ? 'border-line text-ink-faint' : 'border-line bg-white text-ink-soft')}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: off ? '#E7E5E4' : KIND[k].color }} />
              {KIND[k].label}
            </button>
          );
        })}
      </div>
      {view === 'month' && renderMonth()}
      {view === 'week' && renderWeek()}
      {view === 'list' && renderList()}
      <p className="text-[11px] text-ink-faint mt-3">Clique em um dia para adicionar um evento (exames, entrevistas, datas de imigração, viagem…).</p>
      {editingTask && <TaskModal task={editingTask} onClose={() => setEditingTask(null)} />}
      {editingEvent && <EventModal ev={editingEvent} onClose={() => setEditingEvent(null)} />}
    </div>
  );
}
