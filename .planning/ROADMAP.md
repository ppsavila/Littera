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

**Deliverables:**
- Bug corrigido: selecionar ferramenta de marcar erros não apaga anotações do canvas
- Ferramenta de texto: edição inline no canvas (sem prompt/popup do navegador)
- Ferramentas melhoradas: painel de controle para cor/espessura/delete ao estilo Notion
- Cursor contextual por ferramenta ativa
- Shortcut de teclado para trocar ferramentas (E=erros, D=desenho, T=texto, A=seta)

**Success Criteria:**
- Criar anotação de texto sem nenhum popup do navegador
- Alternar entre ferramentas sem perder anotações existentes
- UX review: professor consegue completar uma correção do zero sem fricção visível

---

## Phase 4: Export Upgrade

**Goal:** O PDF entregue ao aluno representa fielmente a correção do professor.

**Requirements:** EXP-01, EXP-02, EXP-03, EXP-04, EXP-05

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

## Summary

| Phase | Focus | Requirements | Status |
|-------|-------|--------------|--------|
| 1 | 3/3 | Complete    | 2026-03-28 |
| 2 | Test Suite | TEST-01–05 | Pending |
| 3 | Annotation UX | ANNO-01–04 | Pending |
| 4 | Export Upgrade | EXP-01–05 | Pending |
| 5 | Plans & Paywall | PLAN-01–04 | Pending |

---
*Roadmap created: 2026-03-28*
*Last updated: 2026-03-28 after Phase 1 planning*
