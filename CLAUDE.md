@AGENTS.md

# 🗂️ Internal Toolset — Littera

> Todo agente que trabalhar neste projeto **deve seguir o protocolo do Internal Toolset**.
> Toolset web: `http://localhost:5173` | API: `http://localhost:3001`
> Protocolo completo: `E:/repos/LocalTools/AGENTS.md`

---

## Identificação do Projeto

- **ID:** `littera`
- **Sigla:** `LIT`
- **PRD:** `E:/repos/LocalTools/PROJECTS/littera/PRD.md`
- **Sprint Atual:** SPRINT-01 (18 Abr → 02 Mai 2026)

---

## ⚡ Início de Sessão — Checklist

Antes de qualquer código, execute:

```bash
# 1. Ver tickets do sprint atual atribuídos a você
curl -s "http://localhost:3001/tickets?projectId=littera" | node -e \
  "const d=require('fs').readFileSync('/dev/stdin','utf8'); JSON.parse(d).filter(t=>t.status==='backlog'||t.status==='in_progress').forEach(t=>console.log(t.id,t.status,t.agent,t.title))"

# 2. Ao iniciar um ticket, marcar como in_progress
curl -s -X PUT http://localhost:3001/tickets/LIT-XXX \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'
```

---

## ✅ Finalização de Ticket — Checklist

```bash
# 1. Marcar como review + adicionar nota com link do PR
curl -s -X PUT http://localhost:3001/tickets/LIT-XXX \
  -H "Content-Type: application/json" \
  -d '{"status": "review", "notes": "PR: https://github.com/.../pull/NNN — descrição breve"}'

# 2. Atualizar KANBAN.md: mover ticket de 🔄 Em Andamento para 👀 Review
# Arquivo: E:/repos/LocalTools/KANBAN.md
```

---

## 🔀 Padrão de PR (OBRIGATÓRIO)

**Título:** `[LIT-XXX] Descrição curta`

**Body mínimo:**
```markdown
## 🎫 Ticket
[LIT-XXX] — Título do ticket
🔗 http://localhost:5173 → Kanban → Littera → LIT-XXX

## 📋 O que foi feito
-

## ✅ Critérios de Aceite
- [x]
- [ ]

## 🧪 Como testar
1.

## ⚠️ Notas para revisão
-
```

---

## 🛠️ Stack (resumo rápido)

- **Framework:** Next.js 16 + App Router + TypeScript (strict)
- **Frontend:** React 19, Tailwind CSS 4, Radix UI, Framer Motion
- **Canvas:** Konva + React Konva
- **State:** Zustand (scoringStore, annotationStore, errorMarkerStore, viewerStore)
- **Banco:** Supabase PostgreSQL + RLS (toda query precisa respeitar RLS)
- **IA:** Anthropic SDK — Claude Sonnet 4.6 (streaming SSE)
- **Pagamentos:** Abacate.pay (PIX) — webhook HMAC-SHA256
- **Path alias:** `@/` → `src/`
- **Stack completa:** `E:/repos/LocalTools/MEMORY/stack.md`

---

## 🚨 Regras Críticas deste Projeto

1. **Nunca quebrar RLS** — toda query ao Supabase deve respeitar Row-Level Security
2. **Nunca commitar `.env.local`** — contém secrets de produção
3. **Testar streaming** — endpoints de IA usam SSE; testar com curl antes de fechar o ticket
4. **Migrations vão para `/supabase/migrations/`** — nunca alterar schema diretamente
5. **Abacate.pay é o único gateway** — qualquer mudança em `/api/subscription/` precisa de revisão cuidadosa

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
