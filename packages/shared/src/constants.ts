import type { ModelOption, ScenarioSummary } from "./schemas";

export const modelIds = ["kimi-k2", "deepseek-v3", "qwen-max", "minimax-m1"] as const;

export const modelOptions: ModelOption[] = [
  {
    id: modelIds[0],
    label: "Kimi K2",
    provider: "Moonshot",
    description: "偏稳健，适合长上下文与克制型博弈。",
  },
  {
    id: modelIds[1],
    label: "DeepSeek V3",
    provider: "DeepSeek",
    description: "推理密度高，适合结构化论证。",
  },
  {
    id: modelIds[2],
    label: "通义千问 Max",
    provider: "Alibaba",
    description: "语言张力更强，适合说服与对抗。",
  },
  {
    id: modelIds[3],
    label: "MiniMax M1",
    provider: "MiniMax",
    description: "表达锋利，适合快速交锋。",
  },
];

export const scenarios: ScenarioSummary[] = [
  {
    id: "shangyang-court",
    title: "商鞅变法·朝堂暗战",
    subject: "历史",
    summary: "在秦国宫廷中围绕变法正当性、利益重构与君主意志展开对抗。",
    turnCount: 20,
    judgeRounds: 3,
    roleAName: "商鞅",
    roleBName: "旧贵族",
  },
];
