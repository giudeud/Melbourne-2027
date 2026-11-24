import { useState } from 'react';
import { AlertTriangle, ExternalLink, Trash2 } from 'lucide-react';
import type { Task, Visa } from '../types';
import { useStore } from '../store/Store';
import { setTaskStatus } from '../lib/tasks';
import { fmtDate, pct, todayISO, uid } from '../lib/utils';
import { Badge, Button, Card, Field, IconButton, Input, PageHeader, Progress, SectionTitle, Textarea } from '../components/ui';
import { DueLabel } from '../components/TaskBits';
import { TaskModal } from '../components/TaskModal';

const STATUS_SUGGESTIONS = ['PAUSED', 'OPEN', 'CLOSED', 'QUOTA REACHED', 'UNKNOWN'];

export default function VisaPage() {
  const { data, update } = useStore();
  const v = data.visa;
  const [editing, setEditing] = useState<Task | null>(null);
  const [logNote, setLogNote] = useState('');
  const set = (patch: Partial<Visa>) => update((d) => ({ ...d, visa: { ...d.visa, ...patch } }));

  const registerCheck = () => {
    const date = todayISO();
    set({ lastChecked: date, history: [{ id: uid(), date, status: v.quotaStatus, note: logNote.trim() }, ...v.history] });
    setLogNote('');
  };

  const tasks = data.tasks.filter((t) => t.category === 'imigracao');
  const done = tasks.filter((t) => t.status === 'done').length;
  const tone = /open|aberta/i.test(v.quotaStatus) ? 'ok' : /paus|closed|fechad|reached/i.test(v.quotaStatus) ? 'warn' : 'neutral';

  return (
    <div className="space-y-8">
      <PageHeader title="Visa Tracker" subtitle="Work and Holiday Visa — subclass 462 (Brasil)" />

      <div className="flex gap-3 rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm">
        <AlertTriangle size={18} className="text-warn shrink-0 mt-0.5" />
        <p className="text-ink-soft">
          As informações desta página são registradas <strong>manualmente</strong> e não são atualizadas automaticamente. Elas não substituem a fonte oficial do
          Department of Home Affairs. Sempre confira o site oficial antes de tomar decisões e registre a data da verificação.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-ink-muted">Status da cota</p>
            <Badge tone={tone} className="text-xs px-2 py-1">{v.quotaStatus || '—'}</Badge>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            {[
              ['País', v.country],
              ['Visto', v.visa],
              ['Subclass', v.subclass],
              ['Cota anual', v.annualQuota],
              ['Destino planejado', v.destination],
              ['Previsão de viagem', v.travelForecast],
              ['Abertura', fmtDate(v.openDate)],
              ['Fechamento', fmtDate(v.closeDate)],
              ['Vagas disponíveis', v.placesAvailable || 'não publicado'],
            ].map(([k, val]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-ink-muted">{k}</dt>
                <dd className="text-right font-medium">{val}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 pt-4 border-t border-line">
            <p className="text-xs text-ink-muted">Última verificação</p>
            <p className="text-sm font-medium">{v.lastChecked ? fmtDate(v.lastChecked) : 'Ainda não registrada'}</p>
            {v.sourceUrl && (
              <a href={v.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs underline underline-offset-2 mt-2">
                Abrir fonte oficial <ExternalLink size={11} />
              </a>
            )}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <SectionTitle>Atualizar informações</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Status da cota">
              <Input list="visa-status" value={v.quotaStatus} onChange={(e) => set({ quotaStatus: e.target.value.toUpperCase() })} />
              <datalist id="visa-status">{STATUS_SUGGESTIONS.map((s) => <option key={s} value={s} />)}</datalist>
            </Field>
            <Field label="Vagas disponíveis (se oficialmente publicado)"><Input value={v.placesAvailable} onChange={(e) => set({ placesAvailable: e.target.value })} /></Field>
            <Field label="Data de abertura"><Input type="date" value={v.openDate ?? ''} onChange={(e) => set({ openDate: e.target.value || null })} /></Field>
            <Field label="Data de fechamento"><Input type="date" value={v.closeDate ?? ''} onChange={(e) => set({ closeDate: e.target.value || null })} /></Field>
            <Field label="Cota anual"><Input value={v.annualQuota} onChange={(e) => set({ annualQuota: e.target.value })} /></Field>
            <Field label="Previsão de viagem"><Input value={v.travelForecast} onChange={(e) => set({ travelForecast: e.target.value })} /></Field>
            <Field label="Destino planejado"><Input value={v.destination} onChange={(e) => set({ destination: e.target.value })} /></Field>
            <Field label="Última atualização (data da verificação)"><Input type="date" value={v.lastChecked ?? ''} onChange={(e) => set({ lastChecked: e.target.value || null })} /></Field>
            <Field label="Link para fonte oficial" className="sm:col-span-2"><Input value={v.sourceUrl} onChange={(e) => set({ sourceUrl: e.target.value })} /></Field>
            <Field label="Observações" className="sm:col-span-2"><Textarea value={v.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <SectionTitle>Registro de verificações</SectionTitle>
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input value={logNote} onChange={(e) => setLogNote(e.target.value)} placeholder="O que você viu no site oficial? (opcional)" />
              <Button variant="primary" onClick={registerCheck}>Registrar verificação hoje</Button>
            </div>
            <p className="text-[11px] text-ink-faint mt-1.5">Salva a data de hoje com o status atual ({v.quotaStatus || '—'}).</p>
            <ul className="mt-4 divide-y divide-line">
              {v.history.length === 0 && <li className="text-sm text-ink-faint py-3">Nenhuma verificação registrada.</li>}
              {v.history.map((h) => (
                <li key={h.id} className="py-2.5 flex items-start gap-3">
                  <span className="text-xs text-ink-muted w-20 shrink-0 pt-0.5">{fmtDate(h.date)}</span>
                  <div className="flex-1 min-w-0">
                    <Badge>{h.status || '—'}</Badge>
                    {h.note && <p className="text-sm text-ink-soft mt-1">{h.note}</p>}
                  </div>
                  <IconButton label="Remover registro" className="hover:text-crit" onClick={() => set({ history: v.history.filter((x) => x.id !== h.id) })}>
                    <Trash2 size={13} />
                  </IconButton>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div>
          <SectionTitle>Tarefas de imigração</SectionTitle>
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Progress value={pct(done, tasks.length)} />
              <span className="text-xs tabular-nums text-ink-muted">{done}/{tasks.length}</span>
            </div>
            <ul className="divide-y divide-line">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2">
                  <input type="checkbox" aria-label={`Concluir ${t.title}`} className="accent-[#3F7D58] h-4 w-4" checked={t.status === 'done'} onChange={() => update((d) => setTaskStatus(d, t.id, t.status === 'done' ? 'todo' : 'done'))} />
                  <button className={`flex-1 text-left text-sm ${t.status === 'done' ? 'line-through text-ink-faint' : ''}`} onClick={() => setEditing(t)}>{t.title}</button>
                  <DueLabel t={t} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
      {editing && <TaskModal task={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
