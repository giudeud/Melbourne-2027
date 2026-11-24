import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Pencil, Pin, Plus, Search, Trash2 } from 'lucide-react';
import type { Note, NoteCategory } from '../types';
import { useStore } from '../store/Store';
import { NOTE_CATEGORIES, noteCategoryLabel } from '../lib/constants';
import { fmtDate, todayISO, uid } from '../lib/utils';
import { Badge, Button, Card, Empty, Field, IconButton, Input, Modal, PageHeader, Select, Textarea } from '../components/ui';

function NoteModal({ note, onClose }: { note: Note; onClose: () => void }) {
  const { data, update } = useStore();
  const [n, setN] = useState(note);
  const isNew = !data.notes.some((x) => x.id === n.id);
  const save = () => {
    if (!n.title.trim()) return;
    update((d) => ({ ...d, notes: isNew ? [n, ...d.notes] : d.notes.map((x) => (x.id === n.id ? n : x)) }));
    onClose();
  };
  return (
    <Modal open wide onClose={onClose} title={isNew ? 'Nova nota' : 'Editar nota'} footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" disabled={!n.title.trim()} onClick={save}>Salvar</Button></>}>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Título" className="sm:col-span-2"><Input autoFocus value={n.title} onChange={(e) => setN({ ...n, title: e.target.value })} /></Field>
        <Field label="Data"><Input type="date" value={n.date} onChange={(e) => setN({ ...n, date: e.target.value })} /></Field>
        <Field label="Categoria">
          <Select value={n.category} onChange={(e) => setN({ ...n, category: e.target.value as NoteCategory })}>
            {NOTE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </Select>
        </Field>
        <Field label="Conteúdo" className="sm:col-span-2"><Textarea value={n.body} onChange={(e) => setN({ ...n, body: e.target.value })} className="min-h-[180px]" /></Field>
        <Field label="Links (um por linha)" className="sm:col-span-2"><Textarea value={n.links} onChange={(e) => setN({ ...n, links: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

export default function Notes() {
  const { data, update } = useStore();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'all' | NoteCategory>('all');
  const [editing, setEditing] = useState<Note | null>(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return data.notes
      .filter((n) => (cat === 'all' || n.category === cat) && (!s || (n.title + ' ' + n.body).toLowerCase().includes(s)))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (a.date < b.date ? 1 : -1));
  }, [data.notes, q, cat]);

  const patch = (id: string, p: Partial<Note>) => update((d) => ({ ...d, notes: d.notes.map((x) => (x.id === id ? { ...x, ...p } : x)) }));

  return (
    <div>
      <PageHeader
        title="Notes & Meeting Log"
        subtitle="Conversas com a AIFS, orçamentos, contatos, entrevistas, decisões e pendências."
        actions={<Button variant="primary" onClick={() => setEditing({ id: uid(), date: todayISO(), category: 'aifs', title: '', body: '', links: '', pinned: false })}><Plus size={15} /> Nova nota</Button>}
      />
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <Input className="pl-8" placeholder="Pesquisar notas…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[{ id: 'all' as const, label: 'Todas' }, ...NOTE_CATEGORIES].map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={clsx('h-8 px-2.5 rounded-lg text-xs border transition-colors', cat === c.id ? 'bg-ink text-white border-ink' : 'bg-white border-line text-ink-soft hover:bg-stone-50')}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
      {list.length === 0 && <Empty>Nenhuma nota ainda. Registre a primeira conversa ou informação importante.</Empty>}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {list.map((n) => (
          <Card key={n.id} className="p-4 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] text-ink-faint">{fmtDate(n.date)}</p>
                <p className="font-medium text-sm mt-0.5">{n.title}</p>
              </div>
              <Badge>{noteCategoryLabel(n.category)}</Badge>
            </div>
            {n.body && <p className="text-sm text-ink-soft mt-2 whitespace-pre-wrap line-clamp-6">{n.body}</p>}
            {n.links.trim() && (
              <ul className="mt-2 space-y-0.5">
                {n.links.split('\n').map((l) => l.trim()).filter(Boolean).map((l, i) => (
                  <li key={i} className="truncate text-xs">
                    <a className="underline underline-offset-2" href={/^https?:/i.test(l) ? l : `https://${l}`} target="_blank" rel="noreferrer">{l}</a>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end mt-auto pt-2">
              <IconButton label={n.pinned ? 'Desafixar' : 'Fixar'} className={n.pinned ? 'text-ink' : ''} onClick={() => patch(n.id, { pinned: !n.pinned })}><Pin size={14} fill={n.pinned ? 'currentColor' : 'none'} /></IconButton>
              <IconButton label="Editar" onClick={() => setEditing(n)}><Pencil size={14} /></IconButton>
              <IconButton label="Excluir" className="hover:text-crit" onClick={() => confirm(`Excluir “${n.title}”?`) && update((d) => ({ ...d, notes: d.notes.filter((x) => x.id !== n.id) }))}><Trash2 size={14} /></IconButton>
            </div>
          </Card>
        ))}
      </div>
      {editing && <NoteModal note={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
