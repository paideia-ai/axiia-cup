import { modelOptions, type ModelId } from '@axiia/shared'
import OpenAI from 'openai'

const SILICONFLOW_BASE_URL = 'https://api.siliconflow.cn/v1'

let _client: OpenAI | null = null

function getSiliconFlowApiKey() {
  const apiKey = process.env.SILICONFLOW_API_KEY

  if (!apiKey) {
    throw new Error('SILICONFLOW_API_KEY is required')
  }

  return apiKey
}

const SILICONFLOW_API_KEY = getSiliconFlowApiKey()

type ChatMessage = {
  role: 'assistant' | 'user'
  content: string
}

function getClient() {
  if (!_client) {
    _client = new OpenAI({
      apiKey: SILICONFLOW_API_KEY,
      baseURL: SILICONFLOW_BASE_URL,
    })
  }

  return _client
}

export async function chatCompletion(params: {
  model: ModelId
  systemPrompt: string
  messages: ChatMessage[]
  temperature?: number
  jsonMode?: boolean
}): Promise<string> {
  const client = getClient()

  try {
    const response = await client.chat.completions.create({
      model: modelOptions.find((m) => m.id === params.model)!.apiModel,
      messages: [
        { role: 'system', content: params.systemPrompt },
        ...params.messages,
      ],
      response_format: params.jsonMode ? { type: 'json_object' } : undefined,
      temperature: params.temperature ?? 0,
    })

    const content = response.choices[0]?.message?.content

    if (!content) {
      throw new Error('Empty completion response')
    }

    return content
  } catch (error) {
    if (error instanceof Error) {
      const status =
        'status' in error
          ? String((error as { status?: number }).status ?? 'unknown')
          : 'unknown'
      throw new Error(
        `SiliconFlow request failed (${status}): ${error.message}`,
        { cause: error },
      )
    }

    throw error
  }
}
