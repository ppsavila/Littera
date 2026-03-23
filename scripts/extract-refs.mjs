import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

async function extractPdf(filePath) {
  const pdfjsLib = await import('../node_modules/pdfjs-dist/legacy/build/pdf.mjs')

  const workerUrl = new URL(
    '../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
    import.meta.url
  ).href
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

  const buffer = readFileSync(filePath)
  const uint8 = new Uint8Array(buffer)
  const loadingTask = pdfjsLib.getDocument({ data: uint8 })
  const pdf = await loadingTask.promise

  let fullText = ''
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    const pageText = content.items
      .map(item => ('str' in item ? item.str : ''))
      .join(' ')
    fullText += pageText + '\n'
  }

  await loadingTask.destroy?.()
  return fullText
}

async function main() {
  mkdirSync(join(root, 'src/lib/ai/refs'), { recursive: true })

  for (let i = 1; i <= 5; i++) {
    const pdfPath = join(root, `.refs/Competencia_${i}.pdf`)
    console.log(`Extraindo Competencia_${i}.pdf...`)
    try {
      const text = await extractPdf(pdfPath)
      const cleaned = text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{3,}/g, ' ')
        .trim()
      const outPath = join(root, `src/lib/ai/refs/competencia_${i}.txt`)
      writeFileSync(outPath, cleaned, 'utf-8')
      console.log(`  ✓ competencia_${i}.txt (${Math.round(cleaned.length / 1024)} KB)`)
    } catch (err) {
      console.error(`  ✗ Erro: ${err.message}`)
    }
  }

  console.log('\n✓ Concluído! Arquivos em src/lib/ai/refs/')
  process.exit(0)
}

main()
