import { useEffect, useRef, useState } from 'react';
import { Link2, Paperclip, Plus, Trash2, X } from 'lucide-react';
import type { Task } from '../types';
import { useStore } from '../store/Store';
import { CATEGORIES, PRIORITIES, STATUSES } from '../lib/constants';
import { deleteTask, upsertTask } from '../lib/tasks';
import { fmtDateTime, uid } from '../lib/utils';
import { db } from '../lib/backend';
import { Button, Field, IconButton, Input, Modal, Select, Textarea } from './ui';

export function TaskModal({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const { data, update, user } = useStore();
  const [t, setT] = useState<Task | null>(task);
  const [newItem, setNewItem] = useState('');
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setT(task), [task]);
  if (!t) return null;
  const isNew = !data.tasks.some((x) => x.id === t.id);
  const set = <K extends keyof Task>(k: K, v: Task[K]) => setT({ ...t, [k]: v });

  const save = () => {
    if (!t.title.trim()) return;
    update((d) => upsertTask(d, { ...t, title: t.title.trim() }));
    onClose();
  };
  const remove = () => {
    if (!confirm(`Excluir a tarefa “${t.title}”?`)) return;
    update((d) => deleteTask(d, t.id));
    onClose();
  };
  const addItem = () => {
    if (!newItem.trim()) return;
    set('checklist', [...t.checklist, { id: uid(), text: newItem.trim(), done: false }]);
    setNewItem('');
  };
  const addLink = () => {
    if (!linkUrl.trim()) return;
    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    set('attachments', [...t.attachments, { id: uid(), name: linkName.trim() || url, url, kind: 'link' }]);
    setLinkName('');
    setLinkUrl('');
  };
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setUploadErr(null);
    setUploading(true);
    try {
      const url = await db.uploadFile(user.id, f);
      setT((cur) => (cur ? { ...cur, attachments: [...cur.attachments, { id: uid(), name: f.name, url, kind: 'file', size: f.size }] } : cur));
    } catch (e) {
      setUploadErr(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const doneCount = t.checklist.filter((c) => c.done).length;

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={isNew ? 'Nova tarefa' : 'Editar tarefa'}
      footer={
        <>
          {!isNew && (
            <Button variant="danger" onClick={remove} className="mr-auto">
              <Trash2 size={14} /> Excluir
            </Button>
          )}
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={save} disabled={!t.title.trim()}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nome da tarefa">
          <Input autoFocus value={t.title} onChange={(e) => set('title', e.target.value)} placeholder="Ex.: Conferir validade do passaporte" onKeyDown={(e) => e.key === 'Enter' && save()} />
        </Field>
        <Field label="Descrição">
          <Textarea value={t.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Categoria">
            <Select value={t.category} onChange={(e) => set('category', e.target.value as Task['category'])}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Prioridade">
            <Select value={t.priority} onChange={(e) => set('priority', e.target.value as Task['priority'])}>
              {PRIORITIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select value={t.status} onChange={(e) => set('status', e.target.value as Task['status'])}>
              {STATUSES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Sprint">
            <Select value={t.sprintId ?? ''} onChange={(e) => set('sprintId', e.target.value || null)}>
              <option value="">Sem sprint</option>
              {data.sprints.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Prazo">
            <Input type="date" value={t.dueDate ?? ''} onChange={(e) => set('dueDate', e.target.value || null)} />
          </Field>
          <Field label="Criada em">
            <Input value={fmtDateTime(t.createdAt)} disabled />
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-ink-muted">Checklist</span>
            {t.checklist.length > 0 && <span className="text-[11px] text-ink-faint">{doneCount}/{t.checklist.length}</span>}
          </div>
          <ul className="space-y-1">
            {t.checklist.map((c) => (
              <li key={c.id} className="flex items-center gap-2 group">
                <input
                  type="checkbox"
                  className="accent-[#3F7D58] h-4 w-4"
                  checked={c.done}
                  onChange={() => set('checklist', t.checklist.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)))}
                />
                <input
                  className={`flex-1 text-sm bg-transparent focus:outline-none ${c.done ? 'line-through text-ink-faint' : ''}`}
                  value={c.text}
                  onChange={(e) => set('checklist', t.checklist.map((x) => (x.id === c.id ? { ...x, text: e.target.value } : x)))}
                />
                <IconButton label="Remover item" onClick={() => set('checklist', t.checklist.filter((x) => x.id !== c.id))}>
                  <X size={14} />
                </IconButton>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mt-2">
            <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Novo item…" onKeyDown={(e) => e.key === 'Enter' && addItem()} />
            <Button onClick={addItem}><Plus size={14} /> Item</Button>
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-ink-muted">Anexos e links</span>
          <ul className="space-y-1 mt-1">
            {t.attachments.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-sm">
                {a.kind === 'link' ? <Link2 size={14} className="text-ink-faint" /> : <Paperclip size={14} className="text-ink-faint" />}
                <a href={a.url} target="_blank" rel="noreferrer" download={a.kind === 'file' && a.url.startsWith('data:') ? a.name : undefined} className="flex-1 truncate underline decoration-line underline-offset-2 hover:decoration-ink">
                  {a.name}
                </a>
                <IconButton label="Remover anexo" onClick={() => set('attachments', t.attachments.filter((x) => x.id !== a.id))}>
                  <X size={14} />
                </IconButton>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto] gap-2 mt-2">
            <Input value={linkName} onChange={(e) => setLinkName(e.target.value)} placeholder="Nome (opcional)" />
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://drive.google.com/…" onKeyDown={(e) => e.key === 'Enter' && addLink()} />
            <Button onClick={addLink}><Link2 size={14} /> Link</Button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Paperclip size={14} /> {uploading ? 'Enviando…' : 'Anexar arquivo'}
            </Button>
            {uploadErr && <span className="text-xs text-crit">{uploadErr}</span>}
          </div>
        </div>

        <Field label="Observações">
          <Textarea value={t.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
