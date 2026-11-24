import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Plus } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, TaskStatus } from '../types';
import { useStore } from '../store/Store';
import { STATUSES } from '../lib/constants';
import { applyFilters, deleteTask, emptyFilters, newTask, withCompletion, type TaskFilters } from '../lib/tasks';
import { Button, PageHeader } from '../components/ui';
import { FiltersBar, TaskCardBody } from '../components/TaskBits';
import { TaskModal } from '../components/TaskModal';

type Cols = Record<TaskStatus, string[]>;

const COL_HINT: Record<TaskStatus, string> = {
  backlog: 'Ainda não iniciadas',
  todo: 'Planejadas',
  in_progress: 'Em andamento',
  done: 'Concluídas',
};

function SortableCard({ t, onEdit, onDelete }: { t: Task; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: t.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onDoubleClick={onEdit}
      className={clsx(
        'bg-white border border-line rounded-lg p-3 shadow-card cursor-grab active:cursor-grabbing touch-manipulation select-none',
        isDragging && 'opacity-40',
        t.status === 'done' && 'bg-stone-50/60',
      )}
    >
      <TaskCardBody t={t} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function Column({ id, ids, byId, onEdit, onDelete, onAdd }: { id: TaskStatus; ids: string[]; byId: Map<string, Task>; onEdit: (t: Task) => void; onDelete: (t: Task) => void; onAdd: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${id}` });
  const label = STATUSES.find((s) => s.id === id)!.label;
  return (
    <div className="flex flex-col w-[280px] sm:w-[300px] shrink-0 lg:w-auto lg:shrink lg:min-w-0">
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-2">
          <span className={clsx('h-2 w-2 rounded-full', id === 'done' ? 'bg-ok' : id === 'in_progress' ? 'bg-warn' : id === 'todo' ? 'bg-ink' : 'bg-ink-faint')} />
          <h3 className="text-xs font-semibold uppercase tracking-wide">{label}</h3>
          <span className="text-xs text-ink-faint">{ids.length}</span>
        </div>
        <button onClick={onAdd} className="text-ink-faint hover:text-ink p-1 rounded" aria-label={`Adicionar em ${label}`} title="Adicionar tarefa">
          <Plus size={15} />
        </button>
      </div>
      <p className="text-[11px] text-ink-faint px-1 mb-2">{COL_HINT[id]}</p>
      <div
        ref={setNodeRef}
        className={clsx('flex-1 rounded-xl p-2 space-y-2 min-h-[200px] transition-colors', isOver ? 'bg-stone-200/60' : 'bg-stone-100/70')}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {ids.map((tid) => {
            const t = byId.get(tid);
            return t ? <SortableCard key={tid} t={t} onEdit={() => onEdit(t)} onDelete={() => onDelete(t)} /> : null;
          })}
        </SortableContext>
        {ids.length === 0 && <p className="text-xs text-ink-faint text-center py-6">Arraste tarefas para cá</p>}
      </div>
    </div>
  );
}

export default function Kanban() {
  const { data, update } = useStore();
  const [f, setF] = useState<TaskFilters>(emptyFilters);
  const [editing, setEditing] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragCols, setDragCols] = useState<Cols | null>(null);

  const visible = useMemo(() => applyFilters(data.tasks, { ...f, status: 'all' }), [data.tasks, f]);
  const byId = useMemo(() => new Map(data.tasks.map((t) => [t.id, t])), [data.tasks]);

  const baseCols = useMemo(() => {
    const c: Cols = { backlog: [], todo: [], in_progress: [], done: [] };
    [...visible].sort((a, b) => a.order - b.order).forEach((t) => c[t.status].push(t.id));
    return c;
  }, [visible]);
  const cols = dragCols ?? baseCols;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findCol = (c: Cols, id: string): TaskStatus | null => {
    if (id.startsWith('col:')) return id.slice(4) as TaskStatus;
    return (Object.keys(c) as TaskStatus[]).find((k) => c[k].includes(id)) ?? null;
  };

  const onStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
    setDragCols(baseCols);
  };

  const onOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over || !dragCols) return;
    const a = String(active.id);
    const o = String(over.id);
    const from = findCol(dragCols, a);
    const to = findCol(dragCols, o);
    if (!from || !to || from === to) return;
    setDragCols((prev) => {
      if (!prev) return prev;
      const fromItems = prev[from].filter((x) => x !== a);
      const toItems = [...prev[to]];
      const idx = o.startsWith('col:') ? toItems.length : Math.max(0, toItems.indexOf(o));
      toItems.splice(idx, 0, a);
      return { ...prev, [from]: fromItems, [to]: toItems };
    });
  };

  const onEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    const a = String(active.id);
    let final = dragCols ?? baseCols;
    if (over) {
      const o = String(over.id);
      const col = findCol(final, a);
      const overCol = findCol(final, o);
      if (col && overCol === col && !o.startsWith('col:')) {
        const oldI = final[col].indexOf(a);
        const newI = final[col].indexOf(o);
        if (oldI !== newI) final = { ...final, [col]: arrayMove(final[col], oldI, newI) };
      }
    }
    setActiveId(null);
    setDragCols(null);
    if (!over) return;
    const pos = new Map<string, { status: TaskStatus; order: number }>();
    (Object.keys(final) as TaskStatus[]).forEach((s) => final[s].forEach((id, i) => pos.set(id, { status: s, order: i })));
    update((d) => ({
      ...d,
      tasks: d.tasks.map((t) => {
        const p = pos.get(t.id);
        if (!p) return t;
        if (p.status === t.status && p.order === t.order) return t;
        return withCompletion({ ...t, status: p.status, order: p.order }, t);
      }),
    }));
  };

  const del = (t: Task) => {
    if (confirm(`Excluir a tarefa “${t.title}”?`)) update((d) => deleteTask(d, t.id));
  };

  const active = activeId ? byId.get(activeId) : null;

  return (
    <div>
      <PageHeader
        title="Kanban Board"
        subtitle="Arraste os cards entre as colunas. Duplo clique ou ícone de lápis para editar."
        actions={
          <Button variant="primary" onClick={() => setEditing(newTask({ sprintId: f.sprint !== 'all' && f.sprint !== 'none' ? f.sprint : null }))}>
            <Plus size={15} /> Nova tarefa
          </Button>
        }
      />
      <FiltersBar f={f} setF={setF} hideStatus />
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onStart} onDragOver={onOver} onDragEnd={onEnd} onDragCancel={() => { setActiveId(null); setDragCols(null); }}>
        <div className="flex lg:grid lg:grid-cols-4 gap-4 overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0 snap-x lg:snap-none">
          {STATUSES.map((s) => (
            <div key={s.id} className="snap-start contents lg:block">
              <Column
                id={s.id}
                ids={cols[s.id]}
                byId={byId}
                onEdit={setEditing}
                onDelete={del}
                onAdd={() => setEditing(newTask({ status: s.id, sprintId: f.sprint !== 'all' && f.sprint !== 'none' ? f.sprint : null }))}
              />
            </div>
          ))}
        </div>
        <DragOverlay>
          {active ? (
            <div className="bg-white border border-line rounded-lg p-3 shadow-lift rotate-1 w-[280px]">
              <TaskCardBody t={active} onEdit={() => {}} onDelete={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      {editing && <TaskModal task={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
