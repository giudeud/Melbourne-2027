import type { AppData, CategoryId, DocumentItem, Priority, Sprint, Task, TaskStatus } from '../types';
import { uid } from '../lib/utils';

type Row = [title: string, priority: Priority, sprint: string | null, due?: string | null, status?: TaskStatus, description?: string];

const S1 = 'sprint-01';
const S2 = 'sprint-02';
const S3 = 'sprint-03';
const S4 = 'sprint-04';

const TASKS: Record<CategoryId, Row[]> = {
  documentacao: [
    ['Conferir validade do passaporte brasileiro', 'urgent', S1, '2026-11-30', 'todo', 'O passaporte precisa estar válido durante toda a estadia prevista. Conferir data de expiração e, se necessário, agendar renovação na Polícia Federal.'],
    ['Solicitar diploma da ESPM', 'high', S1, '2026-12-05', 'todo', 'Solicitar o diploma (ou 2ª via) junto à secretaria da ESPM.'],
    ['Solicitar histórico acadêmico completo', 'high', S1, '2026-12-05', 'todo', 'Solicitar o histórico completo e oficial na secretaria da ESPM.'],
    ['Organizar documentos pessoais', 'medium', S2, '2027-01-15', 'backlog', 'RG, CPF, certidão de nascimento, comprovante de residência, carteira de motorista.'],
    ['Verificar necessidade de certidões', 'medium', S2, '2027-01-10', 'backlog', 'Ex.: certidão de antecedentes criminais (Polícia Federal). Confirmar exigência no site oficial antes de emitir.'],
    ['Consultar histórico de vistos australianos anteriores', 'high', S1, '2026-12-15', 'todo', 'Reunir números de vistos anteriores, datas de entrada/saída e eventuais comprovantes (ImmiAccount / VEVO).'],
  ],
  traducoes: [
    ['Verificar quais documentos precisam de tradução', 'high', S2, '2026-12-20', 'backlog', 'Conferir na lista oficial de documentos do visto 462 quais exigem tradução para o inglês.'],
    ['Solicitar orçamento de tradução juramentada', 'medium', S2, '2027-01-05', 'backlog'],
    ['Traduzir diploma', 'medium', S2, '2027-01-20', 'backlog'],
    ['Traduzir histórico acadêmico', 'medium', S2, '2027-01-20', 'backlog'],
    ['Organizar versões originais e traduzidas', 'low', S2, '2027-01-31', 'backlog'],
    ['Armazenar documentos finais', 'low', S2, '2027-01-31', 'backlog', 'Pasta digital (nuvem) + pasta física com cópias.'],
  ],
  ingles: [
    ['Localizar resultado do TOEFL antigo', 'high', S1, '2026-12-01', 'todo'],
    ['Confirmar modalidade do exame realizado', 'medium', S1, '2026-12-05', 'backlog', 'iBT, ITP, PBT? Nem todas as modalidades são aceitas.'],
    ['Confirmar pontuação e escala', 'medium', S1, '2026-12-05', 'backlog'],
    ['Verificar validade do resultado', 'high', S1, '2026-12-08', 'backlog', 'Resultados de testes costumam ter prazo de validade — conferir a regra oficial vigente.'],
    ['Consultar testes aceitos pelo governo australiano', 'high', S3, null, 'backlog', 'Conferir na página oficial do Home Affairs quais testes e pontuações são aceitos para o 462.'],
    ['Comparar TOEFL, IELTS e PTE', 'medium', S3, null, 'backlog', 'Comparar preço, datas disponíveis, formato e tempo de resultado.'],
    ['Planejar nova prova', 'medium', S3, null, 'backlog'],
    ['Agendar exame', 'high', S3, null, 'backlog'],
    ['Realizar exame', 'high', S3, null, 'backlog'],
    ['Armazenar certificado', 'low', S3, null, 'backlog'],
  ],
  financeiro: [
    ['Criar reserva financeira para a Austrália', 'high', S1, '2026-12-01', 'in_progress', 'Abrir conta/investimento separado para a reserva.'],
    ['Meta inicial: AUD 5.000', 'high', S1, null, 'in_progress', 'Reserva sem contar a passagem de saída. Acompanhar no Financial Tracker.'],
    ['Planejar dinheiro para passagem de saída', 'medium', S3, null, 'backlog'],
    ['Criar controle de economia mensal', 'medium', S1, '2026-12-10', 'todo', 'Definir meta mensal no Financial Tracker.'],
    ['Registrar valores economizados', 'medium', S1, null, 'todo', 'Registrar cada depósito no Financial Tracker.'],
    ['Organizar extratos bancários', 'medium', S3, null, 'backlog', 'Podem ser usados como comprovação de fundos — conferir exigência oficial.'],
    ['Acompanhar cotação AUD/BRL', 'low', S1, null, 'todo'],
    ['Calcular orçamento inicial de chegada', 'medium', S4, null, 'backlog'],
  ],
  imigracao: [
    ['Acompanhar abertura da cota brasileira', 'urgent', S1, null, 'in_progress', 'Monitorar a página oficial do Work and Holiday (subclass 462) e registrar no Visa Tracker.'],
    ['Monitorar status do Work and Holiday Visa', 'high', S2, null, 'backlog'],
    ['Conferir requisitos oficiais atualizados', 'high', S2, null, 'backlog'],
    ['Verificar limite anual de vagas', 'medium', S2, null, 'backlog'],
    ['Conferir elegibilidade', 'high', S2, null, 'backlog', 'Idade, escolaridade, inglês, fundos, saúde e caráter — conforme regras oficiais vigentes.'],
    ['Organizar documentos para aplicação', 'high', S3, null, 'backlog'],
    ['Preencher formulário de aplicação', 'high', S3, null, 'backlog'],
    ['Pagar taxa do visto', 'high', S3, null, 'backlog'],
    ['Acompanhar processamento', 'medium', S3, null, 'backlog'],
    ['Registrar aprovação do visto', 'medium', S4, null, 'backlog'],
  ],
  aupair: [
    ['Pesquisar programa AIFS', 'high', S1, '2026-11-30', 'in_progress'],
    ['Solicitar informações sobre o programa', 'high', S1, '2026-12-05', 'todo'],
    ['Consultar valores e taxas', 'medium', S1, '2026-12-10', 'todo'],
    ['Entender o processo de seleção', 'medium', S1, '2026-12-15', 'backlog'],
    ['Verificar requisitos para ser Au Pair', 'medium', S2, null, 'backlog'],
    ['Organizar referências de experiência com crianças', 'medium', S2, null, 'backlog'],
    ['Preparar apresentação pessoal', 'medium', S4, null, 'backlog'],
    ['Preparar perfil para famílias anfitriãs', 'medium', S4, null, 'backlog'],
    ['Pesquisar famílias', 'medium', S4, null, 'backlog'],
    ['Realizar entrevistas', 'high', S4, null, 'backlog'],
    ['Confirmar família anfitriã', 'high', S4, null, 'backlog'],
    ['Conferir contrato e condições de hospedagem', 'high', S4, null, 'backlog'],
  ],
  viagem: [
    ['Pesquisar passagens aéreas', 'medium', S4, null, 'backlog'],
    ['Comparar rotas para Melbourne', 'low', S4, null, 'backlog'],
    ['Pesquisar seguro-saúde', 'high', S4, null, 'backlog', 'Conferir exigência de seguro-saúde nas condições do visto.'],
    ['Organizar mala', 'low', S4, null, 'backlog'],
    ['Planejar orçamento de chegada', 'medium', S4, null, 'backlog'],
    ['Pesquisar chip de celular', 'low', S4, null, 'backlog'],
    ['Pesquisar transporte público', 'low', S4, null, 'backlog', 'Melbourne: cartão myki, trams, trens e ônibus.'],
    ['Organizar documentos físicos e digitais', 'medium', S4, null, 'backlog'],
    ['Definir data de embarque', 'high', S4, null, 'backlog'],
  ],
};

const SPRINTS: Sprint[] = [
  {
    id: S1,
    name: 'Sprint 01 — Organização Inicial',
    goal: 'Levantar o ponto de partida: documentos, inglês, finanças e primeiro contato com a AIFS.',
    objectives: [
      'Conferir passaporte',
      'Localizar TOEFL',
      'Solicitar diploma',
      'Solicitar histórico acadêmico',
      'Iniciar reserva financeira',
      'Conversar com AIFS',
      'Organizar histórico migratório',
    ],
    startDate: '2026-11-01',
    endDate: '2026-12-31',
    periodLabel: 'Novembro a dezembro de 2026',
    owner: 'Eu',
    status: 'active',
    retrospective: '',
  },
  {
    id: S2,
    name: 'Sprint 02 — Documentação',
    goal: 'Deixar documentos acadêmicos e pessoais prontos e traduzidos quando necessário.',
    objectives: [
      'Organizar documentos acadêmicos',
      'Verificar exigências de tradução',
      'Fazer traduções necessárias',
      'Organizar documentos pessoais',
      'Monitorar regras oficiais do visto',
    ],
    startDate: '2026-12-01',
    endDate: '2027-01-31',
    periodLabel: 'Dezembro de 2026 a janeiro de 2027',
    owner: 'Eu',
    status: 'planned',
    retrospective: '',
  },
  {
    id: S3,
    name: 'Sprint 03 — Qualificação',
    goal: 'Cumprir os requisitos de inglês e fundos e preparar a aplicação do visto.',
    objectives: [
      'Confirmar teste de inglês exigido',
      'Agendar e realizar prova',
      'Organizar comprovação financeira',
      'Conferir requisitos atualizados',
      'Preparar aplicação do visto',
    ],
    startDate: null,
    endDate: null,
    periodLabel: 'Conforme janela de aplicação',
    owner: 'Eu',
    status: 'planned',
    retrospective: '',
  },
  {
    id: S4,
    name: 'Sprint 04 — Go to Melbourne',
    goal: 'Fechar Au Pair, seguro e passagem e preparar a mudança.',
    objectives: [
      'Finalizar processo com AIFS',
      'Definir família anfitriã',
      'Organizar seguro',
      'Comprar passagem',
      'Preparar mudança',
    ],
    startDate: null,
    endDate: null,
    periodLabel: 'Após encaminhamento/aprovação do visto',
    owner: 'Eu',
    status: 'planned',
    retrospective: '',
  },
];

const emptySteps = { quote: false, sent: false, received: false, reviewed: false, stored: false };

function doc(name: string, category: CategoryId, type: string, needsTranslation: 'yes' | 'no' | 'tbc', notes = ''): DocumentItem {
  return {
    id: uid(),
    name,
    category,
    type,
    status: 'not_requested',
    requestedAt: null,
    receivedAt: null,
    needsTranslation,
    originalLanguage: needsTranslation === 'no' ? '' : 'Português',
    translationLanguage: needsTranslation === 'no' ? '' : 'Inglês',
    fileUrl: '',
    notes,
    translationSteps: { ...emptySteps },
  };
}

export function buildSeed(): AppData {
  const now = new Date().toISOString();
  const tasks: Task[] = [];
  let i = 0;
  (Object.keys(TASKS) as CategoryId[]).forEach((cat) => {
    TASKS[cat].forEach(([title, priority, sprint, due, status, description]) => {
      i += 1;
      tasks.push({
        id: uid(),
        title,
        description: description ?? '',
        category: cat,
        priority,
        status: status ?? 'backlog',
        sprintId: sprint,
        createdAt: now,
        dueDate: due ?? null,
        notes: '',
        checklist: [],
        attachments: [],
        order: i,
        completedAt: null,
      });
    });
  });

  // A few helpful starter checklists
  const withChecklist: Record<string, string[]> = {
    'Conferir validade do passaporte brasileiro': ['Ver data de expiração', 'Checar páginas livres', 'Agendar renovação se necessário'],
    'Localizar resultado do TOEFL antigo': ['Procurar e-mail/conta ETS', 'Baixar PDF do score report'],
    'Pesquisar programa AIFS': ['Ler site oficial', 'Anotar dúvidas', 'Registrar em Notes & Logs'],
  };
  tasks.forEach((t) => {
    const items = withChecklist[t.title];
    if (items) t.checklist = items.map((text) => ({ id: uid(), text, done: false }));
  });

  return {
    version: 1,
    tasks,
    sprints: SPRINTS.map((s) => ({ ...s, objectives: [...s.objectives] })),
    documents: [
      doc('Passaporte brasileiro', 'documentacao', 'Documento de identidade', 'no', 'Conferir validade.'),
      doc('Diploma ESPM', 'documentacao', 'Acadêmico', 'tbc'),
      doc('Histórico acadêmico completo', 'documentacao', 'Acadêmico', 'tbc'),
      doc('RG / CPF', 'documentacao', 'Documento pessoal', 'no'),
      doc('Certidão de nascimento', 'documentacao', 'Certidão', 'tbc', 'Verificar se é exigida.'),
      doc('Certidão de antecedentes criminais', 'documentacao', 'Certidão', 'tbc', 'Verificar se é exigida e em qual etapa.'),
      doc('Resultado TOEFL (antigo)', 'ingles', 'Proficiência', 'no', 'Localizar score report.'),
      doc('Histórico de vistos australianos', 'imigracao', 'Imigração', 'no'),
      doc('Extratos bancários', 'financeiro', 'Comprovação financeira', 'tbc'),
      doc('Referências de experiência com crianças', 'aupair', 'Referência', 'tbc'),
    ],
    finance: {
      goalAud: 5000,
      monthlyGoalAud: 500,
      exitTicketBrl: 0,
      arrivalBudgetAud: 0,
      rate: { brlPerAud: null, updatedAt: null, source: null, refDate: null },
      deposits: [],
    },
    visa: {
      country: 'Brasil',
      visa: 'Work and Holiday Visa',
      subclass: '462',
      annualQuota: '500 vagas (sujeito a alterações oficiais)',
      quotaStatus: 'PAUSED',
      destination: 'Melbourne',
      travelForecast: 'Junho/julho de 2027',
      openDate: null,
      closeDate: null,
      placesAvailable: '',
      sourceUrl: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/work-holiday-462',
      lastChecked: null,
      notes: 'Status inicial registrado manualmente. Confirmar sempre na fonte oficial do Department of Home Affairs.',
      history: [],
    },
    aupair: {
      program: 'AIFS',
      stage: 'Pesquisa',
      contactName: '',
      contactEmail: '',
      website: '',
      fees: '',
      requirements: '',
      selectionProcess: '',
      childcareReferences: '',
      notes: '',
      families: [],
    },
    events: [
      { id: uid(), title: 'Previsão de mudança para Melbourne', date: '2027-06-15', type: 'travel', notes: 'Estimativa: junho/julho de 2027. Ajustar quando a data de embarque for definida.' },
    ],
    notes: [],
    settings: {
      userName: '',
      moveDate: '2027-06-15',
      moveLabel: 'Junho/Julho 2027',
      bannerUrl: '',
    },
    updatedAt: now,
  };
}
