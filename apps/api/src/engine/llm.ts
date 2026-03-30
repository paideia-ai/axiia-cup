import { modelIds } from "@axiia/shared";
import OpenAI from "openai";

const SILICONFLOW_BASE_URL = "https://api.siliconflow.cn/v1";

const modelMapping = {
  [modelIds[0]]: "Kimi/K2",
  [modelIds[1]]: "deepseek-ai/DeepSeek-V3",
  [modelIds[2]]: "Qwen/Qwen2.5-72B-Instruct",
  [modelIds[3]]: "MiniMax/MiniMax-M1",
} as const;

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

function getClient() {
  const apiKey = process.env.SILICONFLOW_API_KEY;

  if (!apiKey) {
    throw new Error("Missing SILICONFLOW_API_KEY");
  }

  return new OpenAI({
    apiKey,
    baseURL: SILICONFLOW_BASE_URL,
  });
}

export async function chatCompletion(params: {
  model: (typeof modelIds)[number];
  systemPrompt: string;
  messages: ChatMessage[];
  temperature?: number;
  jsonMode?: boolean;
}): Promise<string> {
  const client = getClient();

  try {
    const response = await client.chat.completions.create({
      model: modelMapping[params.model],
      messages: [
        { role: "system", content: params.systemPrompt },
        ...params.messages,
      ],
      response_format: params.jsonMode ? { type: "json_object" } : undefined,
      temperature: params.temperature ?? 0,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Empty completion response");
    }

    return content;
  } catch (error) {
    if (error instanceof Error) {
      const status = "status" in error ? String((error as { status?: number }).status ?? "unknown") : "unknown";
      throw new Error(`SiliconFlow request failed (${status}): ${error.message}`);
    }

    throw error;
  }
}
