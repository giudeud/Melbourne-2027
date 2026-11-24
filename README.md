# MELBOURNE ’27 — Work & Holiday / Au Pair

Painel pessoal para organizar a mudança para Melbourne (meados de 2027) via **Work and Holiday Visa subclass 462** + programa **Au Pair (AIFS)**.
Combina Kanban (Trello), páginas editáveis (Notion) e sprints (Scrum).

## Funcionalidades

| Seção | O que faz |
|---|---|
| **Overview** | Banner, data estimada da mudança, status geral, progresso automático, KPIs, foco do dia, próximos prazos, sprint ativa, reserva e visto |
| **My Tasks** | Lista diária agrupada por prazo / categoria / sprint / prioridade, com conclusão rápida |
| **Kanban Board** | Backlog → To Do → In Progress → Done com drag-and-drop (mouse, toque e teclado), filtros e busca |
| **Sprints** | 4 sprints iniciais, criar/editar, mover tarefas entre sprints, progresso %, retrospectiva |
| **Documents** | Tabela e cards, filtros por status/categoria, checklist de tradução juramentada |
| **Financial Tracker** | Depósitos em BRL ou AUD, cotação via API (Frankfurter/BCE) ou manual, gráfico, metas |
| **Visa Tracker** | Campos editáveis do 462, registro datado de verificações na fonte oficial |
| **Au Pair / AIFS** | Dados do programa, famílias anfitriãs, entrevistas, passos |
| **Calendar** | Mês / semana / lista com prazos, sprints, documentos, entrevistas, imigração e viagem |
| **Notes & Logs** | Notas datadas por categoria, links, fixar, busca |
| **Settings** | Perfil, data-alvo, banner, export JSON/CSV, importar backup, restaurar dados iniciais |

Todas as tarefas iniciais do planejamento (62) já vêm cadastradas. Tudo é editável e salvo automaticamente.

> As informações migratórias **não são atualizadas automaticamente**. O status inicial da cota (PAUSED, 500 vagas) foi registrado manualmente
> e deve sempre ser conferido na fonte oficial do Department of Home Affairs.

## Rodar localmente

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # gera dist/
```

## Persistência e autenticação

- **Sem configuração (modo local):** login com e-mail/senha por perfil, dados salvos no `localStorage` do navegador (sobrevivem a recarregar/fechar). Anexos de arquivo até 1,5 MB; para maiores, use links.
- **Com Supabase (recomendado, sincroniza entre dispositivos):**
  1. Crie um projeto em [supabase.com](https://supabase.com).
  2. No SQL Editor, rode [`supabase/schema.sql`](supabase/schema.sql) (tabela com RLS + bucket `attachments`).
  3. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
  4. Reinicie `npm run dev`. A tela de login passa a usar o Supabase Auth.

## Deploy (GitHub Pages)

O workflow `.github/workflows/deploy.yml` publica o app a cada push na `main`.
Em **Settings → Pages**, escolha *Source: GitHub Actions*. Para usar Supabase no deploy, adicione os secrets
`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em **Settings → Secrets and variables → Actions**.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · @dnd-kit · Recharts · Supabase · lucide-react
