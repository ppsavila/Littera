# Requirements: Littera

**Defined:** 2026-03-28
**Core Value:** O professor consegue corrigir uma redação com qualidade e velocidade — da análise à entrega do feedback ao aluno — em menos tempo do que sem a ferramenta.

## v1 Requirements

### Security

- [ ] **SEC-01**: Todas as tabelas Supabase com RLS habilitado e políticas corretas por user_id
- [ ] **SEC-02**: Nenhuma chave de API ou secret exposto no histórico git
- [x] **SEC-03**: Headers de segurança HTTP configurados (CSP, X-Frame-Options, etc.)
- [x] **SEC-04**: Rate limiting nas rotas de API críticas (analyze, login)
- [ ] **SEC-05**: Validação de input em todos os endpoints (sem injeção possível)
- [ ] **SEC-06**: Middleware de autenticação cobre todas as rotas protegidas

### Testing

- [ ] **TEST-01**: Suite de testes de integração para fluxo de autenticação (login, signup, sessão)
- [ ] **TEST-02**: Testes de integração para criação e análise de redação
- [ ] **TEST-03**: Testes de enforcement de assinatura (limites diários, feature flags)
- [ ] **TEST-04**: Testes de acesso ao Supabase (tenant isolation — professor A não acessa dados do B)
- [ ] **TEST-05**: Testes de segurança básicos (auth bypass, acesso direto a API sem token)

### Annotation UX

- [ ] **ANNO-01**: Bug corrigido — ferramenta de marcar erros não apaga anotações anteriores
- [ ] **ANNO-02**: Ferramenta de texto inline (sem popup do navegador, edição no canvas)
- [ ] **ANNO-03**: Ferramentas de desenho/seta com controles estilo Notion (cor, espessura, delete)
- [ ] **ANNO-04**: Fluidez geral do fluxo de correção (sem travamentos perceptíveis)

### Export

- [ ] **EXP-01**: PDF exportado inclui o texto completo da redação
- [ ] **EXP-02**: PDF exportado inclui marcações de erro visíveis no texto
- [ ] **EXP-03**: PDF exportado inclui anotações do canvas (desenhos, setas, texto)
- [ ] **EXP-04**: Layout do PDF formatado e legível para o aluno
- [ ] **EXP-05**: (Premium) Envio do PDF diretamente pelo WhatsApp

### Plans & Paywall

- [ ] **PLAN-01**: Modal de boas-vindas no primeiro login mostrando benefícios dos planos
- [ ] **PLAN-02**: Paywall funcional ao atingir limite diário (bloqueia a ação)
- [ ] **PLAN-03**: Ao bater o paywall, exibe modal de upgrade com benefícios dos planos
- [ ] **PLAN-04**: Indicadores visuais de feature Premium no fluxo (tooltip/lock antes de usar)

## v2 Requirements

### Advanced Annotation

- **ANNO-05**: Comentários com thread (resposta do aluno)
- **ANNO-06**: Modo de comparação antes/depois de revisão

### Advanced Export

- **EXP-06**: Export para Google Docs / Word
- **EXP-07**: Link compartilhável para o aluno (sem baixar PDF)

### Analytics

- **ANAL-01**: Dashboard de métricas do professor (redações/semana, médias por competência)
- **ANAL-02**: Ranking de progresso por turma

## Out of Scope

| Feature | Reason |
|---------|--------|
| App mobile | Web-first; mobile requer budget adicional |
| Collaboration real-time | Complexidade alta, nenhum usuário pediu |
| Pagamento próprio | Abacate.pay já integrado e funcionando |
| Suporte a idiomas além do português | Produto BR-specific por design |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Pending |
| SEC-02 | Phase 1 | Pending |
| SEC-03 | Phase 1 | Complete |
| SEC-04 | Phase 1 | Complete |
| SEC-05 | Phase 1 | Pending |
| SEC-06 | Phase 1 | Pending |
| TEST-01 | Phase 2 | Pending |
| TEST-02 | Phase 2 | Pending |
| TEST-03 | Phase 2 | Pending |
| TEST-04 | Phase 2 | Pending |
| TEST-05 | Phase 2 | Pending |
| ANNO-01 | Phase 3 | Pending |
| ANNO-02 | Phase 3 | Pending |
| ANNO-03 | Phase 3 | Pending |
| ANNO-04 | Phase 3 | Pending |
| EXP-01 | Phase 4 | Pending |
| EXP-02 | Phase 4 | Pending |
| EXP-03 | Phase 4 | Pending |
| EXP-04 | Phase 4 | Pending |
| EXP-05 | Phase 4 | Pending |
| PLAN-01 | Phase 5 | Pending |
| PLAN-02 | Phase 5 | Pending |
| PLAN-03 | Phase 5 | Pending |
| PLAN-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after initial definition*
