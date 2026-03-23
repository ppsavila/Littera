'use client'

import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { COMPETENCIES, type AIAnalysis } from '@/types/essay'

interface Props {
  analysis: AIAnalysis | null
  streamingText: string
  isAnalyzing: boolean
  onAnalyze: () => void
}

export function AIAnalysisCard({ analysis, streamingText, isAnalyzing, onAnalyze }: Props) {
  const [expandedComp, setExpandedComp] = useState<string | null>(null)

  if (isAnalyzing && !analysis) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
          <span className="text-sm font-medium text-gray-700">Analisando redação...</span>
        </div>
        {streamingText && (
          <div className="bg-purple-50 rounded-lg p-3 text-xs text-gray-600 font-mono whitespace-pre-wrap overflow-auto max-h-80">
            {streamingText}
            <span className="animate-pulse">▊</span>
          </div>
        )}
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center p-6 gap-4 text-center h-full">
        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-purple-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-1">Análise com IA</p>
          <p className="text-xs text-gray-500">
            A IA analisará a redação segundo as 5 competências do ENEM e sugerirá notas e feedback.
          </p>
        </div>
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Analisar com IA
        </button>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-3">
      {/* Re-analyze button */}
      <button
        onClick={onAnalyze}
        disabled={isAnalyzing}
        className="w-full flex items-center justify-center gap-2 py-1.5 text-xs text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
      >
        <Sparkles className="w-3 h-3" />
        {isAnalyzing ? 'Analisando...' : 'Reanalisar'}
      </button>

      {/* Overall feedback */}
      {analysis.overall_feedback && (
        <div className="bg-purple-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-purple-700 mb-1">Feedback Geral</p>
          <p className="text-xs text-gray-700 leading-relaxed">{analysis.overall_feedback}</p>
        </div>
      )}

      {/* Per-competency */}
      {COMPETENCIES.map((comp) => {
        const data = analysis.competencies[comp.key]
        if (!data) return null
        const isExpanded = expandedComp === comp.key

        return (
          <div
            key={comp.key}
            className="border border-gray-100 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setExpandedComp(isExpanded ? null : comp.key)}
              className="w-full flex items-center gap-2 p-3 hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: comp.color }}
              >
                {comp.number}
              </div>
              <span className="flex-1 text-xs font-medium text-gray-700 text-left">
                {comp.title}
              </span>
              <span className="text-xs font-bold" style={{ color: comp.color }}>
                {data.suggested_score}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              )}
            </button>

            {isExpanded && (
              <div className="px-3 pb-3 space-y-2">
                <p className="text-xs text-gray-600 leading-relaxed">{data.feedback}</p>

                {data.strengths && data.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-green-600 mb-1">Pontos positivos</p>
                    <ul className="space-y-0.5">
                      {data.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-gray-600 flex gap-1">
                          <span className="text-green-500">+</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.issues && data.issues.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-500 mb-1">Pontos de atenção</p>
                    <ul className="space-y-0.5">
                      {data.issues.map((issue, i) => (
                        <li key={i} className="text-xs text-gray-600 flex gap-1">
                          <span className="text-red-400">!</span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {comp.key === 'c5' && data.proposal_present === false && (
                  <p className="text-xs text-red-500 font-medium">
                    ⚠ Proposta de intervenção não encontrada — nota 0
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
