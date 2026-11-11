import pb from '@/lib/pocketbase/client'
import type { AgentChatResult } from '@/lib/skipAi'
import type { NodeShape } from '@/types/mindmap'

export interface ParsedAiNode {
  tempId?: string
  parentTempId?: string | null
  parentId?: string | null
  text: string
  x?: number
  y?: number
  color?: string
  shape?: NodeShape
}

export interface AiConversionResult {
  summary: string
  nodes: ParsedAiNode[]
  rawContent: string
}

/** Envia mensagem para o agente nativo Skip Cloud via backend hook */
export async function askMindmapAgent(
  message: string,
  conversationId?: string | null,
): Promise<AgentChatResult> {
  const token = pb.authStore.token
  if (!token) throw new Error('Você precisa estar autenticado para usar a IA.')

  const baseUrl = import.meta.env.VITE_POCKETBASE_URL || ''
  const response = await fetch(`${baseUrl}/backend/v1/mindmap/ai-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify({
      message,
      conversation_id: conversationId || null,
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data?.error || `Falha na IA (${response.status})`)
  }

  return data as AgentChatResult
}

/** Extrai JSON de resposta do agente (markdown fence ou json direto) */
export function extractJsonFromAiResponse(content: string): AiConversionResult {
  let jsonString = ''

  const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch && fenceMatch[1]) {
    jsonString = fenceMatch[1].trim()
  } else {
    // Tenta achar chaves { ... } ou [ ... ]
    const startObj = content.indexOf('{')
    const endObj = content.lastIndexOf('}')
    if (startObj !== -1 && endObj > startObj) {
      jsonString = content.slice(startObj, endObj + 1)
    }
  }

  if (jsonString) {
    try {
      const parsed = JSON.parse(jsonString)
      if (Array.isArray(parsed)) {
        return {
          summary: 'Nós gerados com sucesso',
          nodes: parsed.filter(Boolean),
          rawContent: content,
        }
      }
      if (parsed && typeof parsed === 'object') {
        const nodesList = Array.isArray(parsed.nodes) ? parsed.nodes : []
        return {
          summary: typeof parsed.summary === 'string' ? parsed.summary : 'Nós gerados com sucesso',
          nodes: nodesList.filter(Boolean),
          rawContent: content,
        }
      }
    } catch {
      // json falhou, faz fallback por linhas
    }
  }

  // Fallback se não retornou JSON: extrair linhas de tópicos
  const lines = content
    .split('\n')
    .map((l) => l.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('`'))

  if (lines.length > 0) {
    return {
      summary: 'Tópicos identificados',
      nodes: lines.map((text, idx) => ({
        tempId: `n_${idx + 1}`,
        text: text.slice(0, 120),
        shape: 'rounded' as NodeShape,
      })),
      rawContent: content,
    }
  }

  return {
    summary: 'Nenhum nó pôde ser extraído',
    nodes: [],
    rawContent: content,
  }
}
