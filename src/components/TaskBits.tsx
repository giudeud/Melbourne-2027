import clsx from 'clsx';
import { CalendarDays, CheckSquare, Paperclip, Pencil, Search, Trash2, X } from 'lucide-react';
import type { Task } from '../types';
import { CATEGORIES, PRIORITIES, STATUSES } from '../lib/constants';
import { emptyFilters, type TaskFilters } from '../lib/tasks';
import { fmtDate, isOverdue, daysUntil } from '../lib/utils';
import { useStore } from '../store/Store';
import { Button, CategoryTag, IconButton, Input, PriorityBadge, Select } from './ui';

export function FiltersBar({ f, setF, hideStatus }: { f: TaskFilters; setF: (f: TaskFilters) => void; hideStatus?: boolean }) {
  const { data } = useStore();
  const active = JSON.stringify(f) !== JSON.stringify(emptyFilters);
  return (
    <div className="flex flex-wrap gap-2 items-center mb-4">
      <div className="relative w-full sm:w-60">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <Input className="pl-8" placeholder="Pesquisar tarefa…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} aria-label="Pesquisar tarefa" />
      </div>
      <Select className="w-auto" value={f.sprint} onChange={(e) => setF({ ...f, sprint: e.target.value })} aria-label="Filtrar por sprint">
        <option value="all">Todas as sprints</option>
        <option value="none">Sem sprint</option>
        {data.sprints.map((s) => (
          <option key={s.id} value={s.id}>{s.name.split('—')[0].trim()}</option>
        ))}
      </Select>
      <Select className="w-auto" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} aria-label="Filtrar por categoria">
        <option value="all">Todas as categorias</option>
        {CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>{c.label}</option>
        ))}
      </Select>
      <Select className="w-auto" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} aria-label="Filtrar por prioridade">
        <option value="all">Todas as prioridades</option>
        {PRIORITIES.map((c) => (
          <option key={c.id} value={c.id}>{c.label}</option>
        ))}
      </Select>
      {!hideStatus && (
        <Select className="w-auto" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} aria-label="Filtrar por status">
          <option value="all">Todos os status</option>
          {STATUSES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </Select>
      )}
      <Select className="w-auto" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value as TaskFilters['deadline'] })} aria-label="Filtrar por prazo">
        <option value="all">Qualquer prazo</option>
        <option value="overdue">Atrasadas</option>
        <option value="week">Próximos 7 dias</option>
        <option value="month">Próximos 30 dias</option>
        <option value="has">Com prazo</option>
        <option value="none">Sem prazo</option>
      </Select>
      {active && (
        <Button variant="ghost" size="sm" onClick={() => setF(emptyFilters)}>
          <X size={14} /> Limpar
        </Button>
      )}
    </div>
  );
}

export function DueLabel({ t }: { t: Task }) {
  if (!t.dueDate) return null;
  const over = isOverdue(t.dueDate, t.status === 'done');
  const n = daysUntil(t.dueDate) ?? 99;
  const soon = !over && t.status !== 'done' && n <= 7;
  return (
    <span className={clsx('inline-flex items-center gap-1 text-[11px]', over ? 'text-crit font-medium' : soon ? 'text-warn font-medium' : 'text-ink-muted')}>
      <CalendarDays size={12} />
      {fmtDate(t.dueDate, false)}
    </span>
  );
}

export function TaskCardBody({ t, onEdit, onDelete }: { t: Task; onEdit: () => void; onDelete: () => void }) {
  const { data } = useStore();
  const sprint = data.sprints.find((s) => s.id === t.sprintId);
  const done = t.checklist.filter((c) => c.done).length;
  return (
    <div className="group">
      <div className="flex items-start justify-between gap-2">
        <p className={clsx('text-sm font-medium leading-snug', t.status === 'done' && 'text-ink-muted line-through decoration-ink-faint')}>{t.title}</p>
        <div className="flex -mr-1 -mt-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <IconButton label="Editar" onPointerDown={(e) => e.stopPropagation()} onClick={onEdit} className="h-7 w-7">
            <Pencil size={13} />
          </IconButton>
          <IconButton label="Excluir" onPointerDown={(e) => e.stopPropagation()} onClick={onDelete} className="h-7 w-7 hover:text-crit">
            <Trash2 size={13} />
          </IconButton>
        </div>
      </div>
      {t.description && <p className="text-xs text-ink-muted mt-1 line-clamp-2">{t.description}</p>}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <CategoryTag c={t.category} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PriorityBadge p={t.priority} />
        {sprint && <span className="text-[11px] text-ink-faint">{sprint.name.split('—')[0].trim()}</span>}
        <span className="ml-auto flex items-center gap-2">
          {t.checklist.length > 0 && (
            <span className={clsx('inline-flex items-center gap-1 text-[11px]', done === t.checklist.length ? 'text-ok' : 'text-ink-muted')}>
              <CheckSquare size={12} /> {done}/{t.checklist.length}
            </span>
          )}
          {t.attachments.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted">
              <Paperclip size={12} /> {t.attachments.length}
            </span>
          )}
          <DueLabel t={t} />
        </span>
      </div>
    </div>
  );
}
