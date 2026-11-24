import { useState } from 'react';
import clsx from 'clsx';
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Sprint, Task } from '../types';
import { useStore } from '../store/Store';
import { SPRINT_STATUSES } from '../lib/constants';
import { newTask, setTaskStatus } from '../lib/tasks';
import { fmtDate, pct, uid } from '../lib/utils';
import { Badge, Button, Card, CategoryTag, Field, IconButton, Input, Modal, PageHeader, PriorityBadge, Progress, Select, Textarea } from '../components/ui';
import { DueLabel } from '../components/TaskBits';
import { TaskModal } from '../components/TaskModal';

function SprintModal({ sprint, onClose }: { sprint: Sprint; onClose: () => void }) {
  const { data, update } = useStore();
  const [s, setS] = useState(sprint);
  const [objText, setObjText] = useState(sprint.objectives.join('\n'));
  const isNew = !data.sprints.some((x) => x.id === s.id);
  const save = () => {
    if (!s.name.trim()) return;
    const next = { ...s, objectives: objText.split('\n').map((x) => x.trim()).filter(Boolean) };
    update((d) => ({ ...d, sprints: isNew ? [...d.sprints, next] : d.sprints.map((x) => (x.id === s.id ? next : x)) }));
    onClose();
  };
  const set = <K extends keyof Sprint>(k: K, v: Sprint[K]) => setS({ ...s, [k]: v });
  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={isNew ? 'Nova sprint' : 'Editar sprint'}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={save} disabled={!s.name.trim()}>Salvar</Button>
        </>
      }
    >
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Nome" className="sm:col-span-2"><Input value={s.name} onChange={(e) => set('name', e.target.value)} autoFocus /></Field>
        <Field label="Objetivo" className="sm:col-span-2"><Textarea value={s.goal} onChange={(e) => set('goal', e.target.value)} /></Field>
        <Field label="Objetivos (um por linha)" className="sm:col-span-2"><Textarea value={objText} onChange={(e) => setObjText(e.target.value)} className="min-h-[120px]" /></Field>
        <Field label="Data inicial"><Input type="date" value={s.startDate ?? ''} onChange={(e) => set('startDate', e.target.value || null)} /></Field>
        <Field label="Data final"><Input type="date" value={s.endDate ?? ''} onChange={(e) => set('endDate', e.target.value || null)} /></Field>
        <Field label="Período (texto)"><Input value={s.periodLabel} onChange={(e) => set('periodLabel', e.target.value)} placeholder="Ex.: Conforme janela de aplicação" /></Field>
        <Field label="Responsável"><Input value={s.owner} onChange={(e) => set('owner', e.target.value)} /></Field>
        <Field label="Status">
          <Select value={s.status} onChange={(e) => set('status', e.target.value as Sprint['status'])}>
            {SPRINT_STATUSES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </Select>
        </Field>
        <Field label="Retrospectiva" className="sm:col-span-2" hint="O que funcionou, o que travou, o que mudar na próxima sprint.">
          <Textarea value={s.retrospective} onChange={(e) => set('retrospective', e.target.value)} className="min-h-[100px]" />
        </Field>
      </div>
    </Modal>
  );
}

function SprintCard({ s, onEdit, onEditTask }: { s: Sprint; onEdit: () => void; onEditTask: (t: Task) => void }) {
  const { data, update } = useStore();
  const [open, setOpen] = useState(s.status === 'active');
  const [adding, setAdding] = useState('');
  const tasks = data.tasks.filter((t) => t.sprintId === s.id);
  const done = tasks.filter((t) => t.status === 'done').length;
  const p = pct(done, tasks.length);
  const others = data.tasks.filter((t) => t.sprintId !== s.id && t.status !== 'done');

  const moveTask = (id: string, sprintId: string | null) => update((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, sprintId } : t)) }));
  const remove = () => {
    if (!confirm(`Excluir “${s.name}”? As tarefas ficarão sem sprint.`)) return;
    update((d) => ({ ...d, sprints: d.sprints.filter((x) => x.id !== s.id), tasks: d.tasks.map((t) => (t.sprintId === s.id ? { ...t, sprintId: null } : t)) }));
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <button onClick={() => setOpen(!open)} className="mt-0.5 text-ink-muted" aria-label={open ? 'Recolher' : 'Expandir'}>
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">{s.name}</h3>
              <Badge tone={s.status === 'active' ? 'warn' : s.status === 'completed' ? 'ok' : 'neutral'}>{SPRINT_STATUSES.find((x) => x.id === s.status)?.label}</Badge>
            </div>
            <p className="text-xs text-ink-muted mt-1">
              {s.startDate || s.endDate ? `${fmtDate(s.startDate)} → ${fmtDate(s.endDate)}` : s.periodLabel}
              {(s.startDate || s.endDate) && s.periodLabel ? ` · ${s.periodLabel}` : ''}
              {s.owner && ` · Responsável: ${s.owner}`}
            </p>
            {s.goal && <p className="text-sm text-ink-soft mt-2">{s.goal}</p>}
          </div>
          <div className="flex">
            <IconButton label="Editar sprint" onClick={onEdit}><Pencil size={14} /></IconButton>
            <IconButton label="Excluir sprint" className="hover:text-crit" onClick={remove}><Trash2 size={14} /></IconButton>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-4 pl-7">
          <Progress value={p} />
          <span className="text-xs font-medium tabular-nums w-10 text-right">{p}%</span>
          <span className="text-xs text-ink-faint whitespace-nowrap">{done}/{tasks.length}</span>
        </div>
      </div>
      {open && (
        <div className="border-t border-line bg-stone-50/50 p-5 pl-12 space-y-5">
          {s.objectives.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-2">Objetivos</p>
              <ul className="grid sm:grid-cols-2 gap-1">
                {s.objectives.map((o, i) => <li key={i} className="text-sm text-ink-soft flex gap-2"><span className="text-ink-faint">—</span>{o}</li>)}
              </ul>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-2">Tarefas relacionadas</p>
            <div className="bg-white border border-line rounded-lg divide-y divide-line">
              {tasks.length === 0 && <p className="text-sm text-ink-faint p-3">Nenhuma tarefa nesta sprint.</p>}
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-3 py-2">
                  <input type="checkbox" aria-label={`Concluir ${t.title}`} className="accent-[#3F7D58] h-4 w-4" checked={t.status === 'done'} onChange={() => update((d) => setTaskStatus(d, t.id, t.status === 'done' ? 'todo' : 'done'))} />
                  <button className="flex-1 min-w-0 text-left" onClick={() => onEditTask(t)}>
                    <p className={clsx('text-sm truncate', t.status === 'done' && 'line-through text-ink-faint')}>{t.title}</p>
                    <div className="flex gap-3"><CategoryTag c={t.category} /><DueLabel t={t} /></div>
                  </button>
                  <span className="hidden md:inline"><PriorityBadge p={t.priority} /></span>
                  <Select aria-label="Mover para sprint" className="w-auto h-8 text-xs max-w-[150px]" value={t.sprintId ?? ''} onChange={(e) => moveTask(t.id, e.target.value || null)}>
                    <option value="">Sem sprint</option>
                    {data.sprints.map((x) => <option key={x.id} value={x.id}>{x.name.split('—')[0].trim()}</option>)}
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <Select value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Adicionar tarefa existente">
                <option value="">Adicionar tarefa existente…</option>
                {others.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </Select>
              <Button disabled={!adding} onClick={() => { moveTask(adding, s.id); setAdding(''); }}>Adicionar</Button>
              <Button variant="ghost" onClick={() => onEditTask(newTask({ sprintId: s.id, status: 'todo' }))}><Plus size={14} /> Nova tarefa</Button>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-2">Retrospectiva</p>
            <Textarea
              value={s.retrospective}
              placeholder="O que funcionou? O que travou? O que mudar?"
              onChange={(e) => update((d) => ({ ...d, sprints: d.sprints.map((x) => (x.id === s.id ? { ...x, retrospective: e.target.value } : x)) }))}
            />
          </div>
        </div>
      )}
    </Card>
  );
}

export default function Sprints() {
  const { data } = useStore();
  const [editing, setEditing] = useState<Sprint | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  return (
    <div>
      <PageHeader
        title="Sprints"
        subtitle="Ciclos curtos com objetivo claro. Mova tarefas entre sprints e registre a retrospectiva."
        actions={
          <Button
            variant="primary"
            onClick={() =>
              setEditing({ id: uid(), name: `Sprint ${String(data.sprints.length + 1).padStart(2, '0')} — `, goal: '', objectives: [], startDate: null, endDate: null, periodLabel: '', owner: data.settings.userName || 'Eu', status: 'planned', retrospective: '' })
            }
          >
            <Plus size={15} /> Nova sprint
          </Button>
        }
      />
      <div className="space-y-4">
        {data.sprints.map((s) => <SprintCard key={s.id} s={s} onEdit={() => setEditing(s)} onEditTask={setEditingTask} />)}
      </div>
      {editing && <SprintModal sprint={editing} onClose={() => setEditing(null)} />}
      {editingTask && <TaskModal task={editingTask} onClose={() => setEditingTask(null)} />}
    </div>
  );
}
