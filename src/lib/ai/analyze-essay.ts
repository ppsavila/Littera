import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt, buildEssayUserPrompt } from './prompts'
import type { AIAnalysis } from '@/types/essay'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function parseAnalysis(text: string): AIAnalysis {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Could not parse AI response as JSON')
    parsed = JSON.parse(match[0])
  }
  return {
    ...parsed,
    model: 'claude-sonnet-4-6',
    analyzed_at: new Date().toISOString(),
  }
}

export async function analyzeEssay(
  text: string,
  theme?: string,
  errorContext?: string
): Promise<AIAnalysis> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: buildSystemPrompt(),
    messages: [
      {
        role: 'user',
        content: buildEssayUserPrompt(text, theme, errorContext),
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  return parseAnalysis(content.text)
}

export async function* analyzeEssayStream(
  text: string,
  theme?: string,
  errorContext?: string
) {
  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: buildSystemPrompt(),
    messages: [
      {
        role: 'user',
        content: buildEssayUserPrompt(text, theme, errorContext),
      },
    ],
  })

  let fullText = ''

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      fullText += event.delta.text
      yield { type: 'chunk' as const, text: event.delta.text }
    }
  }

  try {
    const analysis = parseAnalysis(fullText)
    yield { type: 'done' as const, analysis }
  } catch {
    yield { type: 'error' as const, message: 'Erro ao processar análise da IA' }
  }
}
