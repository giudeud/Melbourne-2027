import type { AppData, Task, TaskStatus } from '../types';
import { daysUntil, uid } from './utils';

export function newTask(partial: Partial<Task> = {}): Task {
  return {
    id: uid(),
    title: '',
    description: '',
    category: 'documentacao',
    priority: 'medium',
    status: 'backlog',
    sprintId: null,
    createdAt: new Date().toISOString(),
    dueDate: null,
    notes: '',
    checklist: [],
    attachments: [],
    order: Date.now(),
    completedAt: null,
    ...partial,
  };
}

export function upsertTask(d: AppData, t: Task): AppData {
  const exists = d.tasks.some((x) => x.id === t.id);
  const fixed = withCompletion(t, exists ? d.tasks.find((x) => x.id === t.id)! : null);
  return { ...d, tasks: exists ? d.tasks.map((x) => (x.id === t.id ? fixed : x)) : [...d.tasks, fixed] };
}

export function withCompletion(t: Task, prev: Task | null): Task {
  if (t.status === 'done' && (!prev || prev.status !== 'done' || !t.completedAt)) return { ...t, completedAt: t.completedAt ?? new Date().toISOString() };
  if (t.status !== 'done') return { ...t, completedAt: null };
  return t;
}

export function setTaskStatus(d: AppData, id: string, status: TaskStatus): AppData {
  return {
    ...d,
    tasks: d.tasks.map((t) => (t.id === id ? withCompletion({ ...t, status }, t) : t)),
  };
}

export function deleteTask(d: AppData, id: string): AppData {
  return { ...d, tasks: d.tasks.filter((t) => t.id !== id) };
}

export type DeadlineFilter = 'all' | 'overdue' | 'week' | 'month' | 'none' | 'has';

export interface TaskFilters {
  q: string;
  sprint: string; // 'all' | 'none' | id
  category: string;
  priority: string;
  status: string;
  deadline: DeadlineFilter;
}

export const emptyFilters: TaskFilters = { q: '', sprint: 'all', category: 'all', priority: 'all', status: 'all', deadline: 'all' };

export function applyFilters(tasks: Task[], f: TaskFilters): Task[] {
  const q = f.q.trim().toLowerCase();
  return tasks.filter((t) => {
    if (q && !t.title.toLowerCase().includes(q)) return false;
    if (f.sprint !== 'all' && (f.sprint === 'none' ? t.sprintId !== null : t.sprintId !== f.sprint)) return false;
    if (f.category !== 'all' && t.category !== f.category) return false;
    if (f.priority !== 'all' && t.priority !== f.priority) return false;
    if (f.status !== 'all' && t.status !== f.status) return false;
    if (f.deadline !== 'all') {
      const n = daysUntil(t.dueDate);
      if (f.deadline === 'none' && t.dueDate) return false;
      if (f.deadline === 'has' && !t.dueDate) return false;
      if (f.deadline === 'overdue' && !(n !== null && n < 0 && t.status !== 'done')) return false;
      if (f.deadline === 'week' && !(n !== null && n >= 0 && n <= 7)) return false;
      if (f.deadline === 'month' && !(n !== null && n >= 0 && n <= 30)) return false;
    }
    return true;
  });
}

export function stats(tasks: Task[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const pending = total - done - inProgress;
  const overdue = tasks.filter((t) => t.status !== 'done' && t.dueDate && (daysUntil(t.dueDate) ?? 0) < 0).length;
  return { total, done, inProgress, pending, overdue, progress: total ? Math.round((done / total) * 100) : 0 };
}
