import { getModelDefinition, type EvaluationModelId } from '@axiia/shared'

import { getRepoRootPath, loadRepoEnv } from './_helpers'

type ToolCall = {
  function?: {
    arguments?: string
    name?: string
  }
}

type ChatCompletionResponse = {
  choices?: Array<{
    finish_reason?: string | null
    message?: {
      content?: string | null
      reasoning_content?: string | null
      tool_calls?: ToolCall[] | null
    }
  }>
  code?: number
  message?: string
}

function getCliFlag(name: string) {
  const index = process.argv.indexOf(name)
  if (index === -1) {
    return null
  }

  return process.argv[index + 1] ?? null
}

function getRequestedModel(): EvaluationModelId {
  const value = getCliFlag('--model') ?? 'kimi-k2.5'

  switch (value) {
    case 'deepseek-v3.2':
    case 'kimi-k2.5':
    case 'qwen3.5-397b-a17b':
    case 'gpt-5.4':
    case 'gpt-5.4-mini':
    case 'claude-sonnet-4-5':
    case 'claude-opus-4-5':
      return value
    default:
      throw new Error(`Unsupported --model value: ${value}`)
  }
}

async function callSiliconFlow(body: unknown) {
  const apiKey = process.env.SILICONFLOW_API_KEY

  if (!apiKey) {
    throw new Error(
      `SILICONFLOW_API_KEY is required. Put it in ${getRepoRootPath('.env')}.`,
    )
  }

  const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return (await response.json()) as ChatCompletionResponse
}

function summarizeToolArguments(rawArguments: string | undefined) {
  if (!rawArguments) {
    return {
      argsJsonOk: false,
      argsLength: 0,
      argsPreview: '',
      hasReasoningObject: false,
      topLevelKeys: [] as string[],
    }
  }

  try {
    const parsed = JSON.parse(rawArguments) as Record<string, unknown>
    return {
      argsJsonOk: true,
      argsLength: rawArguments.length,
      argsPreview: rawArguments.slice(0, 800),
      hasReasoningObject:
        typeof parsed.reasoning === 'object' && parsed.reasoning !== null,
      topLevelKeys: Object.keys(parsed),
    }
  } catch {
    return {
      argsJsonOk: false,
      argsLength: rawArguments.length,
      argsPreview: rawArguments.slice(0, 800),
      hasReasoningObject: false,
      topLevelKeys: [] as string[],
    }
  }
}

function summarizeXmlContent(content: string | null | undefined) {
  const value = content ?? ''

  return {
    contentLength: value.length,
    contentPreview: value.slice(0, 800),
    hasResultTag: value.includes('<result>') && value.includes('</result>'),
    hasScoreLikeShape:
      value.includes('<summary>') ||
      value.includes('<verdict>') ||
      value.includes('<reasoning>'),
  }
}

function summarizeJsonContent(content: string | null | undefined) {
  const value = content ?? ''

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    return {
      contentJsonOk: true,
      contentLength: value.length,
      contentPreview: value.slice(0, 800),
      topLevelKeys: Object.keys(parsed),
      hasReasoningObject:
        typeof parsed.reasoning === 'object' && parsed.reasoning !== null,
    }
  } catch {
    return {
      contentJsonOk: false,
      contentLength: value.length,
      contentPreview: value.slice(0, 800),
      topLevelKeys: [] as string[],
      hasReasoningObject: false,
    }
  }
}

function printCaseResult(label: string, result: ChatCompletionResponse) {
  console.log(`\n=== ${label} ===`)

  if (!result.choices?.length) {
    console.log(
      JSON.stringify(
        {
          errorCode: result.code ?? null,
          errorMessage: result.message ?? 'Unknown non-standard response',
        },
        null,
        2,
      ),
    )
    return
  }

  const choice = result.choices[0]
  const message = choice.message ?? {}
  const toolCall = message.tool_calls?.[0]

  console.log(
    JSON.stringify(
      {
        finishReason: choice.finish_reason ?? null,
        hasReasoningContent: Boolean(message.reasoning_content),
        reasoningLength: message.reasoning_content?.length ?? 0,
        reasoningPreview: message.reasoning_content?.slice(0, 500) ?? '',
        content: summarizeJsonContent(message.content),
        xml: summarizeXmlContent(message.content),
        toolCall: toolCall
          ? {
              toolName: toolCall.function?.name ?? null,
              ...summarizeToolArguments(toolCall.function?.arguments),
            }
          : null,
      },
      null,
      2,
    ),
  )
}

async function main() {
  loadRepoEnv()

  const modelId = getRequestedModel()
  const apiModel = getModelDefinition(modelId).apiModel

  const baseMessages = [
    {
      role: 'system',
      content:
        'You are a careful judge. Think deeply before answering. Use Chinese for the final payload.',
    },
    {
      role: 'user',
      content:
        'Debate excerpt: A argues reform is urgent because neighboring states are changing; B argues rapid reform will destabilize aristocratic support. Produce a detailed structured evaluation with substantial reasoning.',
    },
  ]

  const jsonModeResult = await callSiliconFlow({
    model: apiModel,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are a careful judge. Think deeply before answering. Return only valid JSON. The JSON must be a nested object with keys summary, verdict, requests, and reasoning. reasoning must itself be an object with keys findings (array of strings), strengths (array of strings), weaknesses (array of strings), and final_rationale (string). requests must be an object with keys SR1 and GR2. Use Chinese for all values.',
      },
      baseMessages[1],
    ],
  })

  const toolCallResult = await callSiliconFlow({
    model: apiModel,
    temperature: 0,
    tool_choice: 'auto',
    tools: [
      {
        type: 'function',
        function: {
          name: 'report_judgment',
          description: 'Report the final structured judgment',
          parameters: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              verdict: { type: 'string' },
              requests: {
                type: 'object',
                properties: {
                  SR1: { type: 'string' },
                  GR2: { type: 'string' },
                },
                required: ['SR1', 'GR2'],
              },
              reasoning: {
                type: 'object',
                properties: {
                  findings: { type: 'array', items: { type: 'string' } },
                  strengths: { type: 'array', items: { type: 'string' } },
                  weaknesses: { type: 'array', items: { type: 'string' } },
                  final_rationale: { type: 'string' },
                },
                required: [
                  'findings',
                  'strengths',
                  'weaknesses',
                  'final_rationale',
                ],
              },
            },
            required: ['summary', 'verdict', 'requests', 'reasoning'],
          },
        },
      },
    ],
    messages: [
      {
        role: 'system',
        content:
          'You are a careful judge. Think deeply before answering. Prefer calling the tool report_judgment exactly once. Do not answer in plain text if you can call the tool. Use Chinese strings for all values.',
      },
      baseMessages[1],
    ],
  })

  const xmlResult = await callSiliconFlow({
    model: apiModel,
    temperature: 0,
    messages: [
      {
        role: 'system',
        content:
          'You are a careful judge. Think deeply before answering. Do not output JSON. Return exactly one <result> XML block with child tags <summary>, <verdict>, <requests>, and <reasoning>. Inside <requests>, include <SR1> and <GR2>. Inside <reasoning>, include <findings> with repeated <item>, <strengths> with repeated <item>, <weaknesses> with repeated <item>, and <final_rationale>. Use Chinese.',
      },
      baseMessages[1],
    ],
  })

  printCaseResult(`json_object (${modelId})`, jsonModeResult)
  printCaseResult(`tool_call_auto (${modelId})`, toolCallResult)
  printCaseResult(`xml_prompt (${modelId})`, xmlResult)

  console.log('\nNotes:')
  console.log('- SiliconFlow currently rejects forced specific function tool_choice objects.')
  console.log('- In our live tests, json_object + reasoning could truncate assistant content even when reasoning_content was long.')
  console.log('- Tool calls and XML prompts were both healthier in the same session, but XML is easier to make deterministic in the current engine.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
