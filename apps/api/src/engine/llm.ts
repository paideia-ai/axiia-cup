import { modelOptions, type ModelId } from "@axiia/shared";
import OpenAI from "openai";

const SILICONFLOW_BASE_URL = "https://api.siliconflow.cn/v1";

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
  model: ModelId;
  systemPrompt: string;
  messages: ChatMessage[];
  temperature?: number;
  jsonMode?: boolean;
}): Promise<string> {
  const client = getClient();

  try {
    const response = await client.chat.completions.create({
      model: modelOptions.find((m) => m.id === params.model)!.apiModel,
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
