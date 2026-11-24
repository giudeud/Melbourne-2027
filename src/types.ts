export type CategoryId =
  | 'documentacao'
  | 'traducoes'
  | 'ingles'
  | 'financeiro'
  | 'imigracao'
  | 'aupair'
  | 'viagem';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  kind: 'link' | 'file';
  size?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  priority: Priority;
  status: TaskStatus;
  sprintId: string | null;
  createdAt: string; // ISO date
  dueDate: string | null; // YYYY-MM-DD
  notes: string;
  checklist: ChecklistItem[];
  attachments: Attachment[];
  order: number;
  completedAt: string | null;
}

export type SprintStatus = 'planned' | 'active' | 'completed';

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  objectives: string[];
  startDate: string | null;
  endDate: string | null;
  periodLabel: string;
  owner: string;
  status: SprintStatus;
  retrospective: string;
}

export type DocStatus =
  | 'not_requested'
  | 'requested'
  | 'received'
  | 'awaiting_translation'
  | 'translated'
  | 'approved';

export type YesNoTbc = 'yes' | 'no' | 'tbc';

export interface TranslationSteps {
  quote: boolean;
  sent: boolean;
  received: boolean;
  reviewed: boolean;
  stored: boolean;
}

export interface DocumentItem {
  id: string;
  name: string;
  category: CategoryId;
  type: string;
  status: DocStatus;
  requestedAt: string | null;
  receivedAt: string | null;
  needsTranslation: YesNoTbc;
  originalLanguage: string;
  translationLanguage: string;
  fileUrl: string;
  notes: string;
  translationSteps: TranslationSteps;
}

export interface Deposit {
  id: string;
  date: string;
  amount: number;
  currency: 'AUD' | 'BRL';
  rateBrlPerAud: number; // rate used at the moment of the deposit
  amountAud: number;
  note: string;
}

export interface Finance {
  goalAud: number;
  monthlyGoalAud: number;
  exitTicketBrl: number;
  arrivalBudgetAud: number;
  rate: { brlPerAud: number | null; updatedAt: string | null; source: 'api' | 'manual' | null; refDate?: string | null };
  deposits: Deposit[];
}

export interface VisaHistoryEntry {
  id: string;
  date: string;
  status: string;
  note: string;
}

export interface Visa {
  country: string;
  visa: string;
  subclass: string;
  annualQuota: string;
  quotaStatus: string;
  destination: string;
  travelForecast: string;
  openDate: string | null;
  closeDate: string | null;
  placesAvailable: string;
  sourceUrl: string;
  lastChecked: string | null;
  notes: string;
  history: VisaHistoryEntry[];
}

export type FamilyStatus = 'researching' | 'contacted' | 'interview' | 'offer' | 'confirmed' | 'declined';

export interface HostFamily {
  id: string;
  name: string;
  location: string;
  kids: string;
  status: FamilyStatus;
  interviewDate: string | null;
  contact: string;
  notes: string;
}

export interface AuPairInfo {
  program: string;
  stage: string;
  contactName: string;
  contactEmail: string;
  website: string;
  fees: string;
  requirements: string;
  selectionProcess: string;
  childcareReferences: string;
  notes: string;
  families: HostFamily[];
}

export type EventType = 'exam' | 'interview' | 'immigration' | 'document' | 'travel' | 'other';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: EventType;
  notes: string;
}

export type NoteCategory =
  | 'aifs'
  | 'info'
  | 'orcamento'
  | 'contato'
  | 'entrevista'
  | 'decisao'
  | 'pendencia'
  | 'link';

export interface Note {
  id: string;
  date: string;
  category: NoteCategory;
  title: string;
  body: string;
  links: string;
  pinned: boolean;
}

export interface Settings {
  userName: string;
  moveDate: string; // YYYY-MM-DD target
  moveLabel: string;
  bannerUrl: string;
}

export interface AppData {
  version: number;
  tasks: Task[];
  sprints: Sprint[];
  documents: DocumentItem[];
  finance: Finance;
  visa: Visa;
  aupair: AuPairInfo;
  events: CalendarEvent[];
  notes: Note[];
  settings: Settings;
  updatedAt: string;
}
