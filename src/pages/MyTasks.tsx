import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Plus } from 'lucide-react';
import type { Task } from '../types';
import { useStore } from '../store/Store';
import { applyFilters, deleteTask, emptyFilters, newTask, setTaskStatus, type TaskFilters } from '../lib/tasks';
import { PRIORITY_RANK, STATUSES } from '../lib/constants';
import { daysUntil } from '../lib/utils';
import { Badge, Button, Card, CategoryTag, Empty, IconButton, PageHeader, PriorityBadge, Segmented, Select } from '../components/ui';
import { DueLabel, FiltersBar } from '../components/TaskBits';
import { TaskModal } from '../components/TaskModal';
import { Pencil, Trash2 } from 'lucide-react';

type Group = 'deadline' | 'category' | 'sprint' | 'priority';

export default function MyTasks() {
  const { data, update } = useStore();
  const [f, setF] = useState<TaskFilters>({ ...emptyFilters });
  const [group, setGroup] = useState<Group>('deadline');
  const [showDone, setShowDone] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const list = useMemo(() => {
    const l = applyFilters(data.tasks, f).filter((t) => showDone || f.status === 'done' || t.status !== 'done');
    return l.sort((a, b) => {
      const ad = a.dueDate ?? '9999';
      const bd = b.dueDate ?? '9999';
      if (ad !== bd) return ad < bd ? -1 : 1;
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    });
  }, [data.tasks, f, showDone]);

  const groups = useMemo(() => {
    const m = new Map<string, Task[]>();
    const push = (k: string, t: Task) => m.set(k, [...(m.get(k) ?? []), t]);
    list.forEach((t) => {
      if (group === 'deadline') {
        const n = daysUntil(t.dueDate);
        if (t.status === 'done') push('Concluídas', t);
        else if (n === null) push('Sem prazo', t);
        else if (n < 0) push('Atrasadas', t);
        else if (n === 0) push('Hoje', t);
        else if (n <= 7) push('Próximos 7 dias', t);
        else if (n <= 30) push('Próximos 30 dias', t);
        else push('Mais tarde', t);
      } else if (group === 'category') push(t.category, t);
      else if (group === 'sprint') push(data.sprints.find((s) => s.id === t.sprintId)?.name ?? 'Sem sprint', t);
      else push(t.priority, t);
    });
    const order =
      group === 'deadline'
        ? ['Atrasadas', 'Hoje', 'Próximos 7 dias', 'Próximos 30 dias', 'Mais tarde', 'Sem prazo', 'Concluídas']
        : group === 'priority'
          ? ['urgent', 'high', 'medium', 'low']
          : group === 'sprint'
            ? [...data.sprints.map((s) => s.name), 'Sem sprint']
            : [...m.keys()];
    return order.filter((k) => m.has(k)).map((k) => [k, m.get(k)!] as const);
  }, [list, group, data.sprints]);

  const title = (k: string) => {
    if (group === 'category') return <CategoryTag c={k as Task['category']} />;
    if (group === 'priority') return <PriorityBadge p={k as Task['priority']} />;
    return <span className={clsx(k === 'Atrasadas' && 'text-crit')}>{k}</span>;
  };

  return (
    <div>
      <PageHeader
        title="My Tasks"
        subtitle="Sua lista diária: o que está atrasado, o que vence em breve e o que vem depois."
        actions={<Button variant="primary" onClick={() => setEditing(newTask({ status: 'todo' }))}><Plus size={15} /> Nova tarefa</Button>}
      />
      <FiltersBar f={f} setF={setF} />
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Segmented<Group>
          value={group}
          onChange={setGroup}
          options={[
            { id: 'deadline', label: 'Prazo' },
            { id: 'category', label: 'Categoria' },
            { id: 'sprint', label: 'Sprint' },
            { id: 'priority', label: 'Prioridade' },
          ]}
        />
        <label className="inline-flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" className="accent-[#3F7D58]" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Mostrar concluídas
        </label>
        <span className="text-xs text-ink-faint ml-auto">{list.length} tarefas</span>
      </div>

      {groups.length === 0 && <Empty>Nenhuma tarefa encontrada com esses filtros.</Empty>}
      <div className="space-y-6">
        {groups.map(([k, ts]) => (
          <section key={k}>
            <div className="flex items-center gap-2 mb-2 text-[13px] font-semibold">
              {title(k)} <span className="text-ink-faint font-normal text-xs">{ts.length}</span>
            </div>
            <Card className="divide-y divide-line">
              {ts.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-3 sm:px-4 py-2.5 group">
                  <input
                    type="checkbox"
                    aria-label={`Concluir ${t.title}`}
                    className="accent-[#3F7D58] h-4 w-4 shrink-0"
                    checked={t.status === 'done'}
                    onChange={() => update((d) => setTaskStatus(d, t.id, t.status === 'done' ? 'todo' : 'done'))}
                  />
                  <button className="flex-1 min-w-0 text-left" onClick={() => setEditing(t)}>
                    <p className={clsx('text-sm truncate', t.status === 'done' && 'line-through text-ink-faint')}>{t.title}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                      {group !== 'category' && <CategoryTag c={t.category} />}
                      <DueLabel t={t} />
                    </div>
                  </button>
                  <div className="hidden md:flex items-center gap-2">
                    {group !== 'priority' && <PriorityBadge p={t.priority} />}
                    {t.status === 'in_progress' && <Badge tone="warn">Em andamento</Badge>}
                  </div>
                  <Select
                    aria-label="Status"
                    className="w-[118px] h-8 text-xs hidden sm:block"
                    value={t.status}
                    onChange={(e) => update((d) => setTaskStatus(d, t.id, e.target.value as Task['status']))}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </Select>
                  <IconButton label="Editar" onClick={() => setEditing(t)}><Pencil size={14} /></IconButton>
                  <IconButton label="Excluir" className="hover:text-crit" onClick={() => confirm(`Excluir “${t.title}”?`) && update((d) => deleteTask(d, t.id))}>
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              ))}
            </Card>
          </section>
        ))}
      </div>
      {editing && <TaskModal task={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
