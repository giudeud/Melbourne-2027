import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { AuPairInfo, HostFamily, Task } from '../types';
import { useStore } from '../store/Store';
import { FAMILY_STATUSES } from '../lib/constants';
import { setTaskStatus } from '../lib/tasks';
import { fmtDate, pct, uid } from '../lib/utils';
import { Badge, Button, Card, Empty, Field, IconButton, Input, Modal, PageHeader, Progress, SectionTitle, Select, Textarea } from '../components/ui';
import { DueLabel } from '../components/TaskBits';
import { TaskModal } from '../components/TaskModal';

function FamilyModal({ fam, onClose }: { fam: HostFamily; onClose: () => void }) {
  const { data, update } = useStore();
  const [f, setF] = useState(fam);
  const isNew = !data.aupair.families.some((x) => x.id === f.id);
  const set = <K extends keyof HostFamily>(k: K, v: HostFamily[K]) => setF({ ...f, [k]: v });
  const save = () => {
    if (!f.name.trim()) return;
    update((d) => ({ ...d, aupair: { ...d.aupair, families: isNew ? [...d.aupair.families, f] : d.aupair.families.map((x) => (x.id === f.id ? f : x)) } }));
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={isNew ? 'Nova família' : 'Editar família'} footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" disabled={!f.name.trim()} onClick={save}>Salvar</Button></>}>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Família / identificação" className="sm:col-span-2"><Input autoFocus value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Bairro / cidade"><Input value={f.location} onChange={(e) => set('location', e.target.value)} /></Field>
        <Field label="Crianças (idades)"><Input value={f.kids} onChange={(e) => set('kids', e.target.value)} /></Field>
        <Field label="Status">
          <Select value={f.status} onChange={(e) => set('status', e.target.value as HostFamily['status'])}>
            {FAMILY_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
        </Field>
        <Field label="Data da entrevista"><Input type="date" value={f.interviewDate ?? ''} onChange={(e) => set('interviewDate', e.target.value || null)} /></Field>
        <Field label="Contato" className="sm:col-span-2"><Input value={f.contact} onChange={(e) => set('contact', e.target.value)} /></Field>
        <Field label="Notas" className="sm:col-span-2"><Textarea value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

export default function AuPair() {
  const { data, update } = useStore();
  const a = data.aupair;
  const [editingFam, setEditingFam] = useState<HostFamily | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const set = (patch: Partial<AuPairInfo>) => update((d) => ({ ...d, aupair: { ...d.aupair, ...patch } }));
  const tasks = data.tasks.filter((t) => t.category === 'aupair');
  const done = tasks.filter((t) => t.status === 'done').length;
  const aifsNotes = data.notes.filter((n) => n.category === 'aifs').slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader title="Au Pair / AIFS" subtitle="Programa, contatos, famílias anfitriãs e próximos passos." />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <SectionTitle>Programa</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Programa"><Input value={a.program} onChange={(e) => set({ program: e.target.value })} /></Field>
              <Field label="Etapa atual"><Input value={a.stage} onChange={(e) => set({ stage: e.target.value })} placeholder="Pesquisa, inscrição, matching…" /></Field>
              <Field label="Contato (nome)"><Input value={a.contactName} onChange={(e) => set({ contactName: e.target.value })} /></Field>
              <Field label="Contato (e-mail / telefone)"><Input value={a.contactEmail} onChange={(e) => set({ contactEmail: e.target.value })} /></Field>
              <Field label="Site / portal" className="sm:col-span-2"><Input value={a.website} onChange={(e) => set({ website: e.target.value })} placeholder="https://" /></Field>
              <Field label="Valores e taxas" className="sm:col-span-2"><Textarea value={a.fees} onChange={(e) => set({ fees: e.target.value })} placeholder="Registre os valores informados oficialmente pela AIFS." /></Field>
              <Field label="Requisitos para ser Au Pair" className="sm:col-span-2"><Textarea value={a.requirements} onChange={(e) => set({ requirements: e.target.value })} /></Field>
              <Field label="Processo de seleção" className="sm:col-span-2"><Textarea value={a.selectionProcess} onChange={(e) => set({ selectionProcess: e.target.value })} /></Field>
              <Field label="Referências de experiência com crianças" className="sm:col-span-2"><Textarea value={a.childcareReferences} onChange={(e) => set({ childcareReferences: e.target.value })} placeholder="Nome, relação, contato, período…" /></Field>
              <Field label="Observações" className="sm:col-span-2"><Textarea value={a.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
            </div>
          </Card>

          <div>
            <SectionTitle action={<Button size="sm" onClick={() => setEditingFam({ id: uid(), name: '', location: '', kids: '', status: 'researching', interviewDate: null, contact: '', notes: '' })}><Plus size={14} /> Família</Button>}>
              Famílias anfitriãs
            </SectionTitle>
            {a.families.length === 0 ? (
              <Empty>Nenhuma família registrada. Adicione quando iniciar o matching.</Empty>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {a.families.map((f) => (
                  <Card key={f.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{f.name}</p>
                        <p className="text-xs text-ink-muted">{[f.location, f.kids].filter(Boolean).join(' · ') || '—'}</p>
                      </div>
                      <Badge tone={f.status === 'confirmed' ? 'ok' : f.status === 'declined' ? 'crit' : f.status === 'interview' || f.status === 'offer' ? 'warn' : 'neutral'}>
                        {FAMILY_STATUSES.find((s) => s.id === f.status)?.label}
                      </Badge>
                    </div>
                    {f.interviewDate && <p className="text-xs mt-2">Entrevista: {fmtDate(f.interviewDate)}</p>}
                    {f.notes && <p className="text-xs text-ink-muted mt-2 line-clamp-3">{f.notes}</p>}
                    <div className="flex justify-end mt-2">
                      <IconButton label="Editar" onClick={() => setEditingFam(f)}><Pencil size={14} /></IconButton>
                      <IconButton label="Excluir" className="hover:text-crit" onClick={() => confirm(`Excluir “${f.name}”?`) && set({ families: a.families.filter((x) => x.id !== f.id) })}><Trash2 size={14} /></IconButton>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <SectionTitle>Passos Au Pair</SectionTitle>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Progress value={pct(done, tasks.length)} />
                <span className="text-xs tabular-nums text-ink-muted">{done}/{tasks.length}</span>
              </div>
              <ul className="divide-y divide-line">
                {tasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-2">
                    <input type="checkbox" aria-label={`Concluir ${t.title}`} className="accent-[#3F7D58] h-4 w-4" checked={t.status === 'done'} onChange={() => update((d) => setTaskStatus(d, t.id, t.status === 'done' ? 'todo' : 'done'))} />
                    <button className={`flex-1 text-left text-sm ${t.status === 'done' ? 'line-through text-ink-faint' : ''}`} onClick={() => setEditingTask(t)}>{t.title}</button>
                    <DueLabel t={t} />
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          <div>
            <SectionTitle action={<a href="#/notes" className="text-xs text-ink-muted hover:text-ink">Notes & Logs</a>}>Últimas conversas AIFS</SectionTitle>
            <Card className="p-4">
              {aifsNotes.length === 0 ? (
                <p className="text-sm text-ink-faint">Registre conversas em Notes &amp; Logs com a categoria “Conversa AIFS”.</p>
              ) : (
                <ul className="space-y-3">
                  {aifsNotes.map((n) => (
                    <li key={n.id}>
                      <p className="text-xs text-ink-faint">{fmtDate(n.date)}</p>
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.body && <p className="text-xs text-ink-muted line-clamp-2">{n.body}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
      {editingFam && <FamilyModal fam={editingFam} onClose={() => setEditingFam(null)} />}
      {editingTask && <TaskModal task={editingTask} onClose={() => setEditingTask(null)} />}
    </div>
  );
}
