import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import type { AppData } from '../types';
import { useStore } from '../store/Store';
import { buildSeed } from '../data/seed';
import { auth, backendMode, db } from '../lib/backend';
import { categoryLabel, docStatusLabel, priorityLabel, statusLabel } from '../lib/constants';
import { downloadFile, fmtDateTime, toCSV } from '../lib/utils';
import { Button, Card, Field, Input, PageHeader, SectionTitle } from '../components/ui';

export default function SettingsPage() {
  const { data, update, replaceAll, user, lastSaved } = useStore();
  const s = data.settings;
  const set = (p: Partial<typeof s>) => update((d) => ({ ...d, settings: { ...d.settings, ...p } }));
  const importRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const stamp = new Date().toISOString().slice(0, 10);

  const exportJSON = () => downloadFile(`melbourne27-backup-${stamp}.json`, JSON.stringify(data, null, 2), 'application/json');
  const exportCSV = (kind: 'tasks' | 'documents' | 'deposits' | 'notes') => {
    let rows: Record<string, unknown>[] = [];
    if (kind === 'tasks')
      rows = data.tasks.map((t) => ({
        titulo: t.title,
        descricao: t.description,
        categoria: categoryLabel(t.category),
        prioridade: priorityLabel(t.priority),
        status: statusLabel(t.status),
        sprint: data.sprints.find((x) => x.id === t.sprintId)?.name ?? '',
        criada_em: t.createdAt.slice(0, 10),
        prazo: t.dueDate ?? '',
        concluida_em: t.completedAt?.slice(0, 10) ?? '',
        checklist: t.checklist.map((c) => `${c.done ? '[x]' : '[ ]'} ${c.text}`).join(' | '),
        anexos: t.attachments.filter((a) => a.kind === 'link').map((a) => a.url).join(' | '),
        observacoes: t.notes,
      }));
    if (kind === 'documents')
      rows = data.documents.map((d) => ({
        nome: d.name, categoria: categoryLabel(d.category), tipo: d.type, status: docStatusLabel(d.status), solicitado: d.requestedAt ?? '', recebido: d.receivedAt ?? '',
        traducao: d.needsTranslation, idioma_original: d.originalLanguage, idioma_traducao: d.translationLanguage, arquivo: d.fileUrl.startsWith('data:') ? '(arquivo local)' : d.fileUrl, observacoes: d.notes,
      }));
    if (kind === 'deposits')
      rows = data.finance.deposits.map((d) => ({ data: d.date, valor: d.amount, moeda: d.currency, cotacao_brl_por_aud: d.rateBrlPerAud, valor_aud: d.amountAud.toFixed(2), observacao: d.note }));
    if (kind === 'notes') rows = data.notes.map((n) => ({ data: n.date, categoria: n.category, titulo: n.title, conteudo: n.body, links: n.links }));
    if (!rows.length) return setMsg({ ok: false, text: 'Não há dados para exportar nessa categoria.' });
    downloadFile(`melbourne27-${kind}-${stamp}.csv`, '﻿' + toCSV(rows), 'text/csv');
  };

  const importJSON = async (f?: File) => {
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text()) as AppData;
      if (!parsed || !Array.isArray(parsed.tasks)) throw new Error('Arquivo não parece ser um backup do MELBOURNE ’27.');
      if (!confirm('Importar este backup vai substituir todos os dados atuais. Continuar?')) return;
      replaceAll(parsed);
      setMsg({ ok: true, text: 'Backup importado com sucesso.' });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      if (importRef.current) importRef.current.value = '';
    }
  };

  const onBanner = async (f?: File) => {
    if (!f) return;
    try {
      const url = await db.uploadFile(user.id, f);
      set({ bannerUrl: url });
      setMsg({ ok: true, text: 'Imagem do banner atualizada.' });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      if (bannerRef.current) bannerRef.current.value = '';
    }
  };

  const reset = () => {
    if (!confirm('Restaurar os dados iniciais? Todas as alterações serão perdidas (faça um backup antes).')) return;
    const seed = buildSeed();
    seed.settings.userName = s.userName;
    replaceAll(seed);
    setMsg({ ok: true, text: 'Dados iniciais restaurados.' });
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader title="Settings" subtitle="Perfil, banner, backup e exportação." />
      {msg && <p className={`text-sm rounded-lg px-3 py-2 ${msg.ok ? 'bg-ok-soft text-ok' : 'bg-crit-soft text-crit'}`}>{msg.text}</p>}

      <div>
        <SectionTitle>Perfil e projeto</SectionTitle>
        <Card className="p-5 grid sm:grid-cols-2 gap-3">
          <Field label="Seu nome"><Input value={s.userName} onChange={(e) => set({ userName: e.target.value })} /></Field>
          <Field label="Conta"><Input value={user.email} disabled /></Field>
          <Field label="Data-alvo da mudança" hint="Usada na contagem regressiva."><Input type="date" value={s.moveDate} onChange={(e) => set({ moveDate: e.target.value })} /></Field>
          <Field label="Texto da previsão"><Input value={s.moveLabel} onChange={(e) => set({ moveLabel: e.target.value })} /></Field>
        </Card>
      </div>

      <div>
        <SectionTitle>Banner</SectionTitle>
        <Card className="p-5 space-y-3">
          <Field label="URL de uma foto de Melbourne" hint="Deixe vazio para usar a ilustração padrão.">
            <Input value={s.bannerUrl.startsWith('data:') ? '(imagem enviada)' : s.bannerUrl} onChange={(e) => set({ bannerUrl: e.target.value })} placeholder="https://…" />
          </Field>
          <div className="flex flex-wrap gap-2">
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => onBanner(e.target.files?.[0])} />
            <Button onClick={() => bannerRef.current?.click()}><Upload size={14} /> Enviar imagem</Button>
            {s.bannerUrl && <Button variant="ghost" onClick={() => set({ bannerUrl: '' })}>Usar ilustração padrão</Button>}
          </div>
        </Card>
      </div>

      <div>
        <SectionTitle>Exportar dados</SectionTitle>
        <Card className="p-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={exportJSON}><Download size={14} /> Backup completo (JSON)</Button>
            <Button onClick={() => exportCSV('tasks')}><Download size={14} /> Tarefas (CSV)</Button>
            <Button onClick={() => exportCSV('documents')}><Download size={14} /> Documentos (CSV)</Button>
            <Button onClick={() => exportCSV('deposits')}><Download size={14} /> Depósitos (CSV)</Button>
            <Button onClick={() => exportCSV('notes')}><Download size={14} /> Notas (CSV)</Button>
          </div>
          <div className="pt-3 border-t border-line flex flex-wrap items-center gap-2">
            <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => importJSON(e.target.files?.[0])} />
            <Button onClick={() => importRef.current?.click()}><Upload size={14} /> Importar backup (JSON)</Button>
            <span className="text-xs text-ink-faint">Substitui os dados atuais.</span>
          </div>
        </Card>
      </div>

      <div>
        <SectionTitle>Armazenamento</SectionTitle>
        <Card className="p-5 text-sm space-y-2">
          <p>
            Modo: <strong>{backendMode === 'supabase' ? 'Supabase (nuvem)' : 'Local (este navegador)'}</strong>
          </p>
          <p className="text-ink-muted">Último salvamento: {fmtDateTime(lastSaved)}</p>
          {backendMode === 'local' && (
            <p className="text-xs text-ink-muted">
              Os dados ficam salvos neste navegador e sobrevivem a recarregar/fechar a página. Para sincronizar entre dispositivos, configure o Supabase (veja o README) — ou exporte um backup JSON regularmente.
            </p>
          )}
        </Card>
      </div>

      <div>
        <SectionTitle>Zona de risco</SectionTitle>
        <Card className="p-5 flex flex-wrap gap-2">
          <Button variant="danger" onClick={reset}>Restaurar dados iniciais</Button>
          {backendMode === 'local' && (
            <Button
              variant="danger"
              onClick={async () => {
                if (!confirm('Excluir este perfil local e todos os seus dados deste navegador?')) return;
                await auth.deleteLocalAccount(user.id);
                window.location.reload();
              }}
            >
              Excluir perfil local
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
