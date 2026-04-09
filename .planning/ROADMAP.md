# Roadmap: Littera

**Created:** 2026-03-28
**Total Phases:** 5
**Strategy:** Segurança e testes primeiro (fundação sólida), depois UX e conversão.

---

## Phase 1: Security Foundation

**Goal:** Tornar o Littera seguro para dados reais de professores e alunos.

**Requirements:** SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06

**Plans:** 3/3 plans complete

Plans:
- [x] 01-01-PLAN.md — Zod input validation + safe JSON parsing on all API routes (SEC-05)
- [x] 01-02-PLAN.md — Rate limiting on unprotected endpoints + CSP Sentry fix (SEC-03, SEC-04)
- [x] 01-03-PLAN.md — RLS verification, git secrets audit, auth coverage confirmation (SEC-01, SEC-02, SEC-06)

**Deliverables:**
- RLS habilitado e políticas configuradas em todas as tabelas Supabase (`essays`, `students`, `profiles`, `subscriptions`, etc.)
- Auditoria do histórico git para secrets expostos; rotacionar chaves se necessário
- Headers HTTP de segurança via Next.js middleware ou `next.config`
- Rate limiting nas rotas `/api/essays/[id]/analyze` e `/api/auth/*`
- Validação de input/body em todos os route handlers com Zod ou similar
- Verificação que middleware de auth cobre 100% das rotas do dashboard

**Success Criteria:**
- Nenhuma tabela Supabase acessível sem RLS
- `git log -p` não revela nenhuma chave real
- Todas as rotas de API retornam 401 sem token válido

---

## Phase 2: Test Suite

**Goal:** Ter visibilidade sobre o que funciona e o que quebra — do zero.

**Requirements:** TEST-01, TEST-02, TEST-03, TEST-04, TEST-05

**Plans:** 2/4 plans executed

Plans:
- [x] 02-01-PLAN.md — Install Vitest + Playwright, create config files, shared fixtures, CI test job
- [x] 02-02-PLAN.md — Security sweep (401 on all protected routes) + subscription enforcement tests (TEST-05, TEST-03)
- [ ] 02-03-PLAN.md — Essay CRUD integration tests + Zod schema unit tests (TEST-02)
- [ ] 02-04-PLAN.md — Playwright e2e auth flows + tenant isolation tests (TEST-01, TEST-04)

**Deliverables:**
- Framework de testes configurado (Playwright para e2e + Vitest para integração)
- Testes de autenticação: login, logout, signup, sessão persistente, token expirado
- Testes do fluxo principal: upload de redação, análise, save de scores/notas
- Testes de subscription enforcement: limite diário bloqueado, feature flags corretos
- Testes de isolamento: professor A não consegue acessar dados do professor B
- Testes de API sem auth: todas as rotas protegidas retornam 401
- CI configurado para rodar testes em PR

**Success Criteria:**
- Suite roda com `npm test` sem erros
- Cobertura dos fluxos críticos (auth, correção, assinatura)
- Testes de isolamento confirmam RLS funcionando end-to-end

---

## Phase 3: Annotation UX

**Goal:** Tornar o fluxo de correção fluido e satisfatório de usar.

**Requirements:** ANNO-01, ANNO-02, ANNO-03, ANNO-04

**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md — Fix TextRenderer conditional unmount bug (ANNO-01)
- [x] 03-02-PLAN.md — Inline text editing + ShapeControlsPanel Notion-style controls (ANNO-02, ANNO-03)
- [x] 03-03-PLAN.md — Optimistic saves + freehand useRef perf + keyboard shortcuts (ANNO-04)

**Deliverables:**
- Bug corrigido: selecionar ferramenta de marcar erros não apaga anotações do canvas
- Ferramenta de texto: edição inline no canvas (sem prompt/popup do navegador)
- Ferramentas melhoradas: painel de controle para cor/espessura/delete ao estilo Notion
- Cursor contextual por ferramenta ativa
- Shortcut de teclado para trocar ferramentas (E=erros, D=desenho, T=texto, A=seta, X=apagar)

**Success Criteria:**
- Criar anotação de texto sem nenhum popup do navegador
- Alternar entre ferramentas sem perder anotações existentes
- UX review: professor consegue completar uma correção do zero sem fricção visível

---

## Phase 4: Export Upgrade

**Goal:** O PDF entregue ao aluno representa fielmente a correção do professor.

**Requirements:** EXP-01, EXP-02, EXP-03, EXP-04, EXP-05

**Plans:** 2/2 plans complete

Plans:
- [x] 04-01-PLAN.md — Fix text-type PDF export via html2canvas + enhanced scoring page header (EXP-01, EXP-02, EXP-03, EXP-04)
- [x] 04-02-PLAN.md — WhatsApp PDF sharing via Supabase Storage upload + signed URL (EXP-05)

**Deliverables:**
- PDF inclui o texto completo da redação renderizado
- Marcações de erro visíveis no texto (highlight, sublinhado ou ícone inline)
- Anotações do canvas (desenhos, setas, comentários de texto) sobrepostas na página
- Layout limpo e formatado (cabeçalho com nome do aluno, data, scores por competência)
- (Premium) Botão "Enviar por WhatsApp" abre link `wa.me` com PDF como mensagem ou link

**Success Criteria:**
- Professor abre o PDF e vê: texto da redação + marcações + scores + comentários
- Aluno consegue entender o feedback só pelo PDF, sem o app
- Envio WhatsApp abre diretamente a conversa com texto pré-preenchido (Premium)

---

## Phase 5: Plans & Paywall

**Goal:** Usuários entendem os planos, o paywall funciona e o upgrade é natural.

**Requirements:** PLAN-01, PLAN-02, PLAN-03, PLAN-04

**Plans:** 3/3 plans complete

Plans:
- [x] 05-01-PLAN.md — DB migration (onboarded column) + welcome modal on first login (PLAN-01)
- [x] 05-02-PLAN.md — FeatureLockBadge + paywall gates on AI/insights/WhatsApp (PLAN-02, PLAN-03, PLAN-04)
- [x] 05-03-PLAN.md — CPF collection fix in UpgradeModal + pricing page refinement (PLAN-03, PLAN-04)

**Deliverables:**
- Modal de boas-vindas no primeiro login (detectado via flag `onboarded` no perfil)
- Modal mostra comparação Free/Plus/Premium com CTAs claros
- Limite diário atingido → bloqueia ação → exibe modal de upgrade (mesma modal)
- Features Premium/Plus no fluxo têm badge ou lock icon antes de serem usadas
- Página de pricing reformulada para ser mais clara e persuasiva

**Success Criteria:**
- Usuário novo vê modal de planos no primeiro acesso (sem precisar clicar em nada)
- Tentar corrigir redação além do limite → modal aparece com oferta de upgrade
- Click rate no CTA de upgrade mensurável (Supabase analytics ou log simples)

---

---

## Phase 6: UI Readability

**Goal:** O app é visualmente legível, hierárquico e confortável de usar — textos claros, espaçamento consistente e contraste adequado em todo o produto.

**Requirements:** UI-01, UI-02, UI-03, UI-04

**Plans:** 1/2 plans complete

Plans:
- [x] 06-01-PLAN.md — Global typography scale, spacing system, contrast audit + Clay* components and dashboard layout (UI-01, UI-02, UI-03)
- [ ] 06-02-PLAN.md — Landing page hero + pricing page visual polish (UI-04)

**Deliverables:**
- Escala tipográfica revisada: tamanhos de texto maiores e mais hierárquicos (h1–h4 + body + caption)
- Espaçamento e padding consistentes nos componentes principais (cards, inputs, botões)
- Contraste verificado: texto sobre fundo passa WCAG AA
- Landing page: hero com copy grande e chamativo, seção de features legível
- Dashboard: header, sidebar e workspace com espaçamento e tamanhos revisados
- Pricing page: cards de plano com tipografia clara e CTA proeminente

**Success Criteria:**
- Professor abre o app em mobile e lê o conteúdo sem zoom
- Hierarquia visual clara: títulos vs. body vs. labels distinguíveis à distância
- Landing page converte melhor (CTA visível, proposta de valor legível no fold)

---

## Phase 7: Product Analytics

**Goal:** Como dono, consigo ver o que os usuários fazem, onde dropam e quais features usam — sem construir um dashboard próprio.

**Requirements:** ANA-01, ANA-02, ANA-03

**Plans:** 0/2 plans

Plans:
- [ ] 07-01-PLAN.md — PostHog SDK integration (provider, page tracking, user identify)
- [ ] 07-02-PLAN.md — Event instrumentation nos pontos-chave do produto

**Deliverables:**
- PostHog instalado e inicializado (NEXT_PUBLIC_POSTHOG_KEY + NEXT_PUBLIC_POSTHOG_HOST)
- Page tracking automático em todas as rotas
- User identification: professor identificado com userId + plano ao entrar no dashboard
- Eventos instrumentados:
  - `essay_created` — tipo (pdf/image/text), fonte
  - `essay_analyzed` — competências selecionadas, plano do usuário
  - `annotation_used` — tipo (erro/texto/desenho/seta)
  - `export_triggered` — formato (pdf/whatsapp)
  - `upgrade_modal_opened` — trigger (limit/feature-gate/manual)
  - `upgrade_cta_clicked` — plano alvo
  - `pricing_page_viewed`
  - `feature_gate_hit` — feature bloqueada, plano atual
- CSP atualizado para aceitar domínios do PostHog
- Sentry coexiste sem conflito

**Success Criteria:**
- PostHog dashboard mostra pageviews e usuários ativos em tempo real
- Funil de criação de redação (upload → análise → score) visível no PostHog
- Drop-off identificável: onde os usuários param no fluxo principal

---

## Summary

| Phase | Focus | Requirements | Status |
|-------|-------|--------------|--------|
| 1 | Security Foundation | SEC-01-06 | Complete — 2026-03-28 |
| 2 | Test Suite | TEST-01-05 | In Progress (2/4) |
| 3 | Annotation UX | ANNO-01-04 | Complete — 2026-03-29 |
| 4 | Export Upgrade | EXP-01-05 | Complete — 2026-03-29 |
| 5 | Plans & Paywall | PLAN-01-04 | Complete — 2026-03-30 |
| 6 | UI Readability | UI-01-04 | Planned |
| 7 | Product Analytics | ANA-01-03 | Planned |

---
*Roadmap created: 2026-03-28*
*Last updated: 2026-04-09 — Phase 6 plans created*
