export const modelOptions = [
  { id: "kimi-k2.5",    label: "Kimi K2.5",    apiModel: "Pro/moonshotai/Kimi-K2.5"   },
  { id: "deepseek-v3.2", label: "DeepSeek V3.2", apiModel: "deepseek-ai/DeepSeek-V3.2"  },
  { id: "qwen3-8b",     label: "Qwen3 8B",      apiModel: "Qwen/Qwen3-8B" },
  { id: "minimax-m2.5", label: "MiniMax M2.5",  apiModel: "Pro/MiniMaxAI/MiniMax-M2.5" },
] as const satisfies readonly { id: string; label: string; apiModel: string }[];

export type ModelId = typeof modelOptions[number]["id"];
export type ModelOption = typeof modelOptions[number];

export const modelIds = [
  modelOptions[0].id,
  modelOptions[1].id,
  modelOptions[2].id,
  modelOptions[3].id,
] as const;
