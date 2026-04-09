# Phase 6: UI Readability - Context

**Gathered:** 2026-04-09 (assumptions mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Melhorar a legibilidade global do app — tipografia mais hierárquica e legível, espaçamento consistente e contraste adequado — sem redesenhar componentes do zero nem mudar a identidade visual (paleta, fontes Playfair Display / DM Sans permanecem).

Foco: landing page, dashboard/workspace, pricing page. Scope: CSS globals + componentes existentes. Não inclui novas features de UI nem redesign de fluxos.

</domain>

<decisions>
## Implementation Decisions

### Escopo de aplicação
- **D-01:** Melhorias aplicadas globalmente — landing page, dashboard (header, sidebar, workspace), pricing page e componentes compartilhados (cards, botões, inputs).
- **D-02:** Identidade visual mantida: paleta Ink/Parchment/Forest/Gold e fontes Playfair Display + DM Sans não mudam. Apenas tamanhos, pesos, espaçamento e contraste.

### Tipografia
- **D-03:** Aumentar escala tipográfica base — body text de 14px/15px para 16px mínimo; headings (h1–h3) com saltos maiores entre níveis para hierarquia clara.
- **D-04:** Usar pesos mais pesados nos headings (Playfair Display 700–800 em títulos principais) para impacto visual.
- **D-05:** Line-height generoso no body (1.6–1.7) para melhor leiturabilidade em parágrafos longos.
- **D-06:** Labels e captions com tamanho mínimo de 12px e contraste alto (não usar `text-muted` em texto informativo crítico).

### Espaçamento e layout
- **D-07:** Padding interno dos cards aumentado — mínimo 20px (de 12-16px atuais) para respiro visual.
- **D-08:** Botões CTA com padding vertical maior (py-3 no mínimo) para área de toque/clique confortável (Fitts's Law).
- **D-09:** Grupos de elementos com gap consistente — seguir escala 8px (8/16/24/32/48).

### Contraste e acessibilidade
- **D-10:** Verificar e corrigir todos os casos de texto cinza claro sobre fundo claro que não passam WCAG AA (mínimo 4.5:1 para texto normal, 3:1 para texto grande).
- **D-11:** Estados de hover/focus em botões e links devem ser visualmente distintos.

### Landing page
- **D-12:** Hero com h1 grande e bold (Playfair Display 800, ~48–60px desktop / 36px mobile), tagline clara, CTA botão prominente.
- **D-13:** Seção de features com ícones maiores e texto de descrição legível (mínimo 15px, não cinza claro).

### Pricing page
- **D-14:** Card do plano Plus com destaque visual claro (borda colorida ou background diferenciado) — plano alvo de conversão.
- **D-15:** Tabela/lista de features com ícones de check e texto 15px+ para comparação fácil.

### Claude's Discretion
- Decisão exata sobre quais valores px/rem usar (dentro das faixas definidas acima)
- Ordem e agrupamento das melhorias por componente
- Uso de `clamp()` para tipografia responsiva vs. classes separadas por breakpoint

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design system atual
- `src/app/globals.css` — CSS custom properties, paleta de cores, classes utilitárias (`.littera-btn`, `.littera-card`, `.littera-input`), shadows
- `src/app/layout.tsx` — configuração de fontes (Playfair Display + DM Sans), CSS variables `--font-display` e `--font-body`

### Páginas alvo
- `src/app/page.tsx` — landing page (hero, features, CTA)
- `src/app/(dashboard)/layout.tsx` — layout do dashboard (sidebar, header, main content)
- `src/app/(dashboard)/subscription/pricing/page.tsx` (ou similar) — pricing page
- `src/components/layout/Header.tsx` — header do dashboard
- `src/components/layout/Sidebar.tsx` — sidebar do dashboard

### Componentes compartilhados
- `src/components/ui/ClayButton.tsx` — botão principal do sistema
- `src/components/ui/ClayCard.tsx` — card principal do sistema
- `src/components/ui/ClayInput.tsx` — inputs do sistema

### Referências externas de princípios (para o pesquisador)
- Fitts's Law: área de toque/clique — https://lawsofux.com/fittss-law/
- Hick's Law: reduzir opções visuais desnecessárias — https://lawsofux.com/hicks-law/
- Miller's Law: chunks de informação — https://lawsofux.com/millers-law/

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `globals.css` já tem sistema de CSS variables bem estruturado — adicionar novas variáveis de tipografia (--text-base, --text-lg, etc.) seguindo o mesmo padrão
- Tailwind v4 inlined — sem arquivo tailwind.config.ts; customizações via `@theme` ou CSS variables direto
- Classes `.littera-btn`, `.littera-card`, `.littera-input` são o ponto central para mudanças de padding/sizing — editar uma vez aplica em todo o app

### Established Patterns
- Paleta via CSS variables (`--color-forest`, `--color-gold`, etc.) — não hardcodar valores hex
- Componentes usam `clsx`/`tailwind-merge` para variantes — manter esse padrão ao adicionar variantes de tamanho
- Framer Motion já presente — pode usar para micro-animações sutis se necessário (mas não é o foco)

### Integration Points
- `src/app/layout.tsx`: adicionar variáveis CSS de tipografia no `:root` ou no `body`
- `globals.css`: ajustar tamanhos base e classes utilitárias
- Componentes `Clay*` em `src/components/ui/`: ajustar padding e tamanhos de fonte
- `src/app/page.tsx`: refinar hero + features com as novas classes

</code_context>

<specifics>
## Specific Ideas

- "Textos maiores e chamativos" — o usuário quer impacto visual, não só acessibilidade. Hero da landing deve ser bold e grande.
- Referência de princípios: lawsofux.com (Fitts, Hick, Miller) — priorizar clareza e redução de fricção visual
- Referência de boas práticas: made2web.com/blog/10-boas-praticas-de-ux-design e figma.com/pt-br/resource-library/principios-design-ui/ — usar como guia para hierarquia e contraste

</specifics>

<deferred>
## Deferred Ideas

- Redesign completo de componentes ou mudança de identidade visual — fora de escopo
- Dark mode — fora de escopo desta fase
- Animações e micro-interações elaboradas — fora de escopo
- Novos componentes de UI — fora de escopo

</deferred>

---

*Phase: 06-ui-readability*
*Context gathered: 2026-04-09*
