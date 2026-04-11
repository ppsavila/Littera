import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * Extracts handwritten or printed text from an essay image using Claude Vision.
 * Preserves original spelling, punctuation, and paragraph structure.
 * Marks illegible words as [ilegível].
 */
export async function extractTextFromImage(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `Transcreva o texto desta redação exatamente como está escrito, seja manuscrito ou impresso.

Regras obrigatórias:
- Mantenha a ortografia original do autor, mesmo que contenha erros
- Preserve a pontuação e acentuação exatamente como escritas
- Preserve a estrutura de parágrafos com quebras de linha
- Se uma palavra estiver completamente ilegível, escreva [ilegível]
- NÃO corrija, interprete, resuma ou adicione nada
- Retorne APENAS o texto transcrito, sem comentários, títulos ou observações`,
          },
        ],
      },
    ],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude Vision')
  return content.text.trim()
}
