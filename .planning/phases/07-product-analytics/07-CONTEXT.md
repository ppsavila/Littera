# Phase 7: Product Analytics - Context

**Gathered:** 2026-04-09 (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrar PostHog como ferramenta de product analytics — tracking de pageviews, identificação de usuários e eventos nos pontos-chave do produto. O dashboard de visualização é o próprio PostHog (externo). Não inclui construção de /admin page no app nem relatórios customizados.

</domain>

<decisions>
## Implementation Decisions

### Ferramenta escolhida
- **D-01:** PostHog — SDK `posthog-js` (client) + `posthog-node` (server-side events). Hosted em `app.posthog.com` (cloud).
- **D-02:** Variáveis de ambiente: `NEXT_PUBLIC_POSTHOG_KEY` e `NEXT_PUBLIC_POSTHOG_HOST` (value: `https://app.posthog.com`).
- **D-03:** Dashboard de visualização é o painel externo do PostHog — não construir /admin page no Littera.

### Integração client-side
- **D-04:** Provider PostHog adicionado em `src/components/layout/Providers.tsx` — inicializa o SDK e wrappa a app (ao lado do QueryClientProvider existente).
- **D-05:** Page tracking automático via PostHog `capture_pageview` + integração com Next.js router (usePathname/useSearchParams para SPA navigation).
- **D-06:** User identification no `src/app/(dashboard)/layout.tsx` — ao entrar no dashboard, chamar `posthog.identify(userId, { plan, email })`.
- **D-07:** Ao fazer logout, chamar `posthog.reset()` para limpar identidade.

### Eventos a instrumentar (client-side)
- **D-08:** `essay_created` — disparado após POST /api/essays com sucesso. Propriedades: `{ source_type, plan }`.
- **D-09:** `essay_analyzed` — disparado após análise AI com sucesso. Propriedades: `{ competencies_count, plan }`.
- **D-10:** `annotation_used` — disparado ao criar anotação. Propriedades: `{ tool_type: 'error'|'text'|'draw'|'arrow' }`.
- **D-11:** `export_triggered` — disparado ao exportar. Propriedades: `{ format: 'pdf'|'whatsapp' }`.
- **D-12:** `upgrade_modal_opened` — disparado ao abrir UpgradeModal. Propriedades: `{ trigger: 'limit_reached'|'feature_gate'|'manual' }`.
- **D-13:** `upgrade_cta_clicked` — disparado ao clicar no botão de upgrade. Propriedades: `{ target_plan: 'plus'|'premium' }`.
- **D-14:** `pricing_page_viewed` — disparado automaticamente pelo page tracking (sem código extra).
- **D-15:** `feature_gate_hit` — disparado quando usuário tenta acessar feature bloqueada (FeatureLockBadge, paywall gates). Propriedades: `{ feature: string, current_plan: string }`.

### Eventos server-side (opcional, fase 07-02)
- **D-16:** Eventos de subscription (`subscription_started`, `subscription_cancelled`) podem ser disparados via PostHog Node SDK nos webhooks — se tempo permitir; client-side é suficiente para MVP.

### CSP e infraestrutura
- **D-17:** Adicionar domínios PostHog ao `connect-src` no CSP de `next.config.ts`: `https://app.posthog.com https://*.posthog.com`.
- **D-18:** PostHog inicializado com `persistence: 'localStorage'` e `autocapture: false` — captura manual de eventos para controle total e sem ruído.
- **D-19:** Sentry e PostHog coexistem sem conflito — ambos são providers independentes.

### Privacidade
- **D-20:** Não capturar dados pessoais sensíveis nos eventos (sem email, CPF, nome do aluno). Apenas IDs e planos.
- **D-21:** `posthog.identify()` usa apenas `{ plan, created_at }` como propriedades — email não enviado ao PostHog.

### Claude's Discretion
- Estrutura exata do PostHog provider (hook personalizado vs. Context API)
- Se usar `posthog-js/react` (componentes React) ou SDK vanilla
- Estratégia de batching/flush dos eventos

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Infraestrutura existente
- `src/components/layout/Providers.tsx` — ponto de integração do provider PostHog
- `src/app/(dashboard)/layout.tsx` — onde fazer user identify (tem acesso ao user Supabase)
- `next.config.ts` — CSP headers que precisam ser atualizados
- `src/lib/subscriptions/plans.ts` — definições de plano para enriquecer identify

### Componentes a instrumentar (eventos D-08 a D-15)
- `src/app/api/essays/route.ts` — POST handler (essay_created server-side ou trigger client após resposta)
- `src/components/subscription/UpgradeModal.tsx` — upgrade_modal_opened, upgrade_cta_clicked
- `src/components/subscription/FeatureLockBadge.tsx` (ou similar) — feature_gate_hit
- Componente/hook de anotação (AnnotationCanvas, AnnotationToolbar) — annotation_used
- ExportPDFButton ou handler de export — export_triggered
- Hook/componente de análise AI — essay_analyzed

### Sentry (referência para coexistência)
- `sentry.client.config.ts` — padrão de inicialização de SDK externo no client
- `src/instrumentation.ts` — padrão de inicialização server-side

### Docs PostHog (para o pesquisador)
- PostHog Next.js integration: https://posthog.com/docs/libraries/next-js
- PostHog React provider pattern: https://posthog.com/docs/libraries/react

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/logger.ts` — padrão de logging estruturado com contexto (userId, plan) — mesmo padrão para enriquecer eventos PostHog
- `src/lib/subscriptions/access.ts` — já tem lógica de plano do usuário — reutilizar para propriedades do identify
- `src/components/layout/Providers.tsx` — ponto exato para adicionar PostHog provider; atualmente só tem QueryClientProvider

### Established Patterns
- Variáveis de ambiente públicas seguem padrão `NEXT_PUBLIC_*`
- Auth Supabase disponível via `createServerClient` nos layouts server-side
- Client components marcados com `'use client'` — PostHog provider precisa ser client component
- Sentry usa `instrumentation.ts` para server-side — PostHog Node SDK seguiria padrão similar

### Integration Points
- `Providers.tsx`: adicionar `<PostHogProvider>` wrappando children
- `(dashboard)/layout.tsx`: chamar identify após obter user do Supabase
- `next.config.ts`: append PostHog URLs ao connect-src existente
- Cada componente alvo: importar `usePostHog()` hook e chamar `posthog.capture()`

</code_context>

<specifics>
## Specific Ideas

- "Entender em que pontos o usuário dropa o site ou tem dificuldade" — funnels no PostHog: upload → analyze → score → export
- "Trackear o dia a dia do site" — pageviews, DAU/MAU, sessões por plano visíveis no PostHog
- Não precisa de /admin page — o PostHog externo é suficiente para o dono do produto

</specifics>

<deferred>
## Deferred Ideas

- Dashboard /admin no app Littera — usuário não quer, PostHog é suficiente
- Session replay (PostHog feature) — pode ativar depois se quiser ver gravações de sessão, sem mudança de código
- A/B testing via PostHog feature flags — fase futura
- Eventos de subscription via webhook server-side — pode ser adicionado depois; client-side é suficiente para MVP

</deferred>

---

*Phase: 07-product-analytics*
*Context gathered: 2026-04-09*
