import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ExternalLink, LayoutGrid, Pencil, Plus, Table2, Trash2 } from 'lucide-react';
import type { DocStatus, DocumentItem } from '../types';
import { useStore } from '../store/Store';
import { CATEGORIES, DOC_STATUSES, TRANSLATION_STEPS, YES_NO_TBC, categoryLabel, docStatusLabel } from '../lib/constants';
import { fmtDate, uid } from '../lib/utils';
import { Badge, Button, Card, CategoryTag, Empty, Field, IconButton, Input, Modal, PageHeader, Progress, SectionTitle, Segmented, Select, Textarea } from '../components/ui';

const statusTone = (s: DocStatus) =>
  s === 'approved' || s === 'translated' ? 'ok' : s === 'awaiting_translation' || s === 'requested' ? 'warn' : s === 'received' ? 'dark' : 'neutral';

function blank(): DocumentItem {
  return {
    id: uid(), name: '', category: 'documentacao', type: '', status: 'not_requested', requestedAt: null, receivedAt: null,
    needsTranslation: 'tbc', originalLanguage: 'Português', translationLanguage: 'Inglês', fileUrl: '', notes: '',
    translationSteps: { quote: false, sent: false, received: false, reviewed: false, stored: false },
  };
}

function DocModal({ doc, onClose }: { doc: DocumentItem; onClose: () => void }) {
  const { data, update } = useStore();
  const [d, setD] = useState(doc);
  const isNew = !data.documents.some((x) => x.id === d.id);
  const set = <K extends keyof DocumentItem>(k: K, v: DocumentItem[K]) => setD({ ...d, [k]: v });
  const save = () => {
    if (!d.name.trim()) return;
    let fileUrl = d.fileUrl.trim();
    if (fileUrl && !/^(https?:|data:)/i.test(fileUrl)) fileUrl = 'https://' + fileUrl;
    const next = { ...d, fileUrl };
    update((x) => ({ ...x, documents: isNew ? [...x.documents, next] : x.documents.map((y) => (y.id === d.id ? next : y)) }));
    onClose();
  };
  return (
    <Modal open wide onClose={onClose} title={isNew ? 'Novo documento' : 'Editar documento'} footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" disabled={!d.name.trim()} onClick={save}>Salvar</Button></>}>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Nome" className="sm:col-span-2"><Input autoFocus value={d.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Categoria">
          <Select value={d.category} onChange={(e) => set('category', e.target.value as DocumentItem['category'])}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </Select>
        </Field>
        <Field label="Tipo de documento"><Input value={d.type} onChange={(e) => set('type', e.target.value)} placeholder="Acadêmico, certidão, identidade…" /></Field>
        <Field label="Status">
          <Select value={d.status} onChange={(e) => set('status', e.target.value as DocStatus)}>
            {DOC_STATUSES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </Select>
        </Field>
        <Field label="Tradução juramentada?">
          <Select value={d.needsTranslation} onChange={(e) => set('needsTranslation', e.target.value as DocumentItem['needsTranslation'])}>
            {YES_NO_TBC.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </Select>
        </Field>
        <Field label="Data de solicitação"><Input type="date" value={d.requestedAt ?? ''} onChange={(e) => set('requestedAt', e.target.value || null)} /></Field>
        <Field label="Data de recebimento"><Input type="date" value={d.receivedAt ?? ''} onChange={(e) => set('receivedAt', e.target.value || null)} /></Field>
        <Field label="Idioma original"><Input value={d.originalLanguage} onChange={(e) => set('originalLanguage', e.target.value)} /></Field>
        <Field label="Idioma da tradução"><Input value={d.translationLanguage} onChange={(e) => set('translationLanguage', e.target.value)} /></Field>
        <Field label="Link para arquivo" className="sm:col-span-2"><Input value={d.fileUrl} onChange={(e) => set('fileUrl', e.target.value)} placeholder="https://drive.google.com/…" /></Field>
        <Field label="Observações" className="sm:col-span-2"><Textarea value={d.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

export default function Documents() {
  const { data, update } = useStore();
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [status, setStatus] = useState('all');
  const [cat, setCat] = useState('all');
  const [editing, setEditing] = useState<DocumentItem | null>(null);

  const list = useMemo(() => data.documents.filter((d) => (status === 'all' || d.status === status) && (cat === 'all' || d.category === cat)), [data.documents, status, cat]);
  const translation = data.documents.filter((d) => d.needsTranslation !== 'no');
  const del = (d: DocumentItem) => confirm(`Excluir “${d.name}”?`) && update((x) => ({ ...x, documents: x.documents.filter((y) => y.id !== d.id) }));
  const patch = (id: string, p: Partial<DocumentItem>) => update((x) => ({ ...x, documents: x.documents.map((y) => (y.id === id ? { ...y, ...p } : y)) }));

  const ready = data.documents.filter((d) => d.status === 'approved' || d.status === 'translated' || (d.status === 'received' && d.needsTranslation === 'no')).length;

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Document Center"
          subtitle={`${ready} de ${data.documents.length} documentos prontos.`}
          actions={<Button variant="primary" onClick={() => setEditing(blank())}><Plus size={15} /> Novo documento</Button>}
        />
        <div className="flex flex-wrap gap-2 items-center mb-4">
          <Select className="w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrar por status">
            <option value="all">Todos os status</option>
            {DOC_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
          <Select className="w-auto" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filtrar por categoria">
            <option value="all">Todas as categorias</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </Select>
          <div className="ml-auto">
            <Segmented value={view} onChange={setView} options={[{ id: 'table', label: <><Table2 size={13} /> Tabela</> }, { id: 'cards', label: <><LayoutGrid size={13} /> Cards</> }]} />
          </div>
        </div>

        {list.length === 0 && <Empty>Nenhum documento com esses filtros.</Empty>}

        {list.length > 0 && view === 'table' && (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="text-left text-xs text-ink-muted border-b border-line">
                  {['Nome', 'Categoria', 'Tipo', 'Status', 'Solicitado', 'Recebido', 'Tradução', 'Idiomas', 'Arquivo', ''].map((h) => <th key={h} className="font-medium px-3 py-2.5">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((d) => (
                  <tr key={d.id} className="hover:bg-stone-50/60">
                    <td className="px-3 py-2.5 font-medium"><button className="text-left hover:underline" onClick={() => setEditing(d)}>{d.name}</button>{d.notes && <p className="text-[11px] text-ink-faint font-normal truncate max-w-[220px]">{d.notes}</p>}</td>
                    <td className="px-3 py-2.5"><CategoryTag c={d.category} /></td>
                    <td className="px-3 py-2.5 text-ink-muted">{d.type || '—'}</td>
                    <td className="px-3 py-2.5">
                      <Select aria-label="Status" className="h-8 text-xs w-[170px]" value={d.status} onChange={(e) => patch(d.id, { status: e.target.value as DocStatus })}>
                        {DOC_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </Select>
                    </td>
                    <td className="px-3 py-2.5 text-ink-muted whitespace-nowrap">{fmtDate(d.requestedAt)}</td>
                    <td className="px-3 py-2.5 text-ink-muted whitespace-nowrap">{fmtDate(d.receivedAt)}</td>
                    <td className="px-3 py-2.5"><Badge tone={d.needsTranslation === 'yes' ? 'warn' : 'neutral'}>{YES_NO_TBC.find((y) => y.id === d.needsTranslation)?.label}</Badge></td>
                    <td className="px-3 py-2.5 text-ink-muted text-xs whitespace-nowrap">{d.needsTranslation === 'no' ? '—' : `${d.originalLanguage || '?'} → ${d.translationLanguage || '?'}`}</td>
                    <td className="px-3 py-2.5">{d.fileUrl ? <a href={d.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs underline underline-offset-2">Abrir <ExternalLink size={11} /></a> : <span className="text-ink-faint">—</span>}</td>
                    <td className="px-2 py-2.5 whitespace-nowrap">
                      <IconButton label="Editar" onClick={() => setEditing(d)}><Pencil size={14} /></IconButton>
                      <IconButton label="Excluir" className="hover:text-crit" onClick={() => del(d)}><Trash2 size={14} /></IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {list.length > 0 && view === 'cards' && (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {list.map((d) => (
              <Card key={d.id} className="p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{d.name}</p>
                    <p className="text-xs text-ink-muted">{d.type || categoryLabel(d.category)}</p>
                  </div>
                  <Badge tone={statusTone(d.status)}>{docStatusLabel(d.status)}</Badge>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mt-3">
                  <dt className="text-ink-faint">Solicitado</dt><dd>{fmtDate(d.requestedAt)}</dd>
                  <dt className="text-ink-faint">Recebido</dt><dd>{fmtDate(d.receivedAt)}</dd>
                  <dt className="text-ink-faint">Tradução</dt><dd>{YES_NO_TBC.find((y) => y.id === d.needsTranslation)?.label}</dd>
                  {d.needsTranslation !== 'no' && (<><dt className="text-ink-faint">Idiomas</dt><dd>{d.originalLanguage || '?'} → {d.translationLanguage || '?'}</dd></>)}
                </dl>
                {d.notes && <p className="text-xs text-ink-muted mt-2 line-clamp-2">{d.notes}</p>}
                <div className="flex items-center gap-1 mt-auto pt-3">
                  <CategoryTag c={d.category} />
                  <span className="ml-auto" />
                  {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-xs underline underline-offset-2 mr-1">Arquivo</a>}
                  <IconButton label="Editar" onClick={() => setEditing(d)}><Pencil size={14} /></IconButton>
                  <IconButton label="Excluir" className="hover:text-crit" onClick={() => del(d)}><Trash2 size={14} /></IconButton>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionTitle>Checklist — tradução juramentada</SectionTitle>
        <p className="text-xs text-ink-muted -mt-2 mb-3">Documentos marcados como “Sim” ou “A confirmar”. Confirme a exigência oficial antes de contratar a tradução.</p>
        {translation.length === 0 && <Empty>Nenhum documento precisa de tradução.</Empty>}
        <div className="space-y-2">
          {translation.map((d) => {
            const done = TRANSLATION_STEPS.filter((s) => d.translationSteps[s.id]).length;
            return (
              <Card key={d.id} className="p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="md:w-64 shrink-0">
                    <p className="text-sm font-medium">{d.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Select aria-label="Precisa de tradução" className="h-7 text-xs w-auto" value={d.needsTranslation} onChange={(e) => patch(d.id, { needsTranslation: e.target.value as DocumentItem['needsTranslation'] })}>
                        {YES_NO_TBC.map((y) => <option key={y.id} value={y.id}>{y.id === 'yes' ? 'Precisa' : y.id === 'tbc' ? 'A confirmar' : 'Não precisa'}</option>)}
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 flex-1">
                    {TRANSLATION_STEPS.map((s) => (
                      <label key={s.id} className={clsx('inline-flex items-center gap-1.5 text-xs', d.translationSteps[s.id] ? 'text-ok' : 'text-ink-soft')}>
                        <input
                          type="checkbox"
                          className="accent-[#3F7D58]"
                          checked={d.translationSteps[s.id]}
                          onChange={(e) => {
                            const steps = { ...d.translationSteps, [s.id]: e.target.checked };
                            const all = TRANSLATION_STEPS.every((x) => steps[x.id]);
                            patch(d.id, { translationSteps: steps, ...(all && d.status !== 'approved' ? { status: 'translated' as DocStatus } : {}) });
                          }}
                        />
                        {s.label}
                      </label>
                    ))}
                  </div>
                  <div className="md:w-32 flex items-center gap-2">
                    <Progress value={(done / TRANSLATION_STEPS.length) * 100} />
                    <span className="text-[11px] text-ink-faint tabular-nums">{done}/{TRANSLATION_STEPS.length}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      {editing && <DocModal doc={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
