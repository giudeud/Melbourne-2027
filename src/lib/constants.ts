import type { CategoryId, DocStatus, EventType, FamilyStatus, NoteCategory, Priority, SprintStatus, TaskStatus, YesNoTbc } from '../types';

export const CATEGORIES: { id: CategoryId; label: string; short: string; dot: string }[] = [
  { id: 'documentacao', label: 'Documentação', short: 'Docs', dot: '#52525B' },
  { id: 'traducoes', label: 'Traduções Juramentadas', short: 'Traduções', dot: '#7C6F64' },
  { id: 'ingles', label: 'Inglês / Proficiência', short: 'Inglês', dot: '#4B6584' },
  { id: 'financeiro', label: 'Financeiro', short: 'Financeiro', dot: '#3F7D58' },
  { id: 'imigracao', label: 'Imigração / Visa 462', short: 'Visa 462', dot: '#8C5A3C' },
  { id: 'aupair', label: 'Au Pair / AIFS', short: 'Au Pair', dot: '#7A5C8E' },
  { id: 'viagem', label: 'Planejamento da Viagem', short: 'Viagem', dot: '#3D7A8A' },
];

export const categoryLabel = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
export const categoryDot = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.dot ?? '#999';

export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: 'low', label: 'Baixa' },
  { id: 'medium', label: 'Média' },
  { id: 'high', label: 'Alta' },
  { id: 'urgent', label: 'Urgente' },
];
export const priorityLabel = (p: Priority) => PRIORITIES.find((x) => x.id === p)?.label ?? p;
export const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export const STATUSES: { id: TaskStatus; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];
export const statusLabel = (s: TaskStatus) => STATUSES.find((x) => x.id === s)?.label ?? s;

export const SPRINT_STATUSES: { id: SprintStatus; label: string }[] = [
  { id: 'planned', label: 'Planejada' },
  { id: 'active', label: 'Ativa' },
  { id: 'completed', label: 'Concluída' },
];

export const DOC_STATUSES: { id: DocStatus; label: string }[] = [
  { id: 'not_requested', label: 'Não solicitado' },
  { id: 'requested', label: 'Solicitado' },
  { id: 'received', label: 'Recebido' },
  { id: 'awaiting_translation', label: 'Aguardando tradução' },
  { id: 'translated', label: 'Tradução concluída' },
  { id: 'approved', label: 'Aprovado' },
];
export const docStatusLabel = (s: DocStatus) => DOC_STATUSES.find((x) => x.id === s)?.label ?? s;

export const YES_NO_TBC: { id: YesNoTbc; label: string }[] = [
  { id: 'yes', label: 'Sim' },
  { id: 'no', label: 'Não' },
  { id: 'tbc', label: 'A confirmar' },
];

export const TRANSLATION_STEPS: { id: 'quote' | 'sent' | 'received' | 'reviewed' | 'stored'; label: string }[] = [
  { id: 'quote', label: 'Orçamento' },
  { id: 'sent', label: 'Enviado ao tradutor' },
  { id: 'received', label: 'Tradução recebida' },
  { id: 'reviewed', label: 'Conferida' },
  { id: 'stored', label: 'Arquivada' },
];

export const EVENT_TYPES: { id: EventType; label: string }[] = [
  { id: 'exam', label: 'Exame' },
  { id: 'interview', label: 'Entrevista' },
  { id: 'immigration', label: 'Imigração' },
  { id: 'document', label: 'Documento' },
  { id: 'travel', label: 'Viagem' },
  { id: 'other', label: 'Outro' },
];

export const FAMILY_STATUSES: { id: FamilyStatus; label: string }[] = [
  { id: 'researching', label: 'Pesquisando' },
  { id: 'contacted', label: 'Contato feito' },
  { id: 'interview', label: 'Entrevista' },
  { id: 'offer', label: 'Proposta' },
  { id: 'confirmed', label: 'Confirmada' },
  { id: 'declined', label: 'Descartada' },
];

export const NOTE_CATEGORIES: { id: NoteCategory; label: string }[] = [
  { id: 'aifs', label: 'Conversa AIFS' },
  { id: 'info', label: 'Informação recebida' },
  { id: 'orcamento', label: 'Orçamento' },
  { id: 'contato', label: 'Contato' },
  { id: 'entrevista', label: 'Entrevista' },
  { id: 'decisao', label: 'Decisão' },
  { id: 'pendencia', label: 'Pendência' },
  { id: 'link', label: 'Link importante' },
];
export const noteCategoryLabel = (c: NoteCategory) => NOTE_CATEGORIES.find((x) => x.id === c)?.label ?? c;
