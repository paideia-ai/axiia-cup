import type { LeaderboardEntry, MatchTranscriptTurn } from "@axiia/shared";
import { modelOptions, scenarios } from "@axiia/shared";

export const primaryScenario = scenarios[0];

export const leaderboard: LeaderboardEntry[] = [
  { submissionId: 101, rank: 1, playerName: "选手 2048", modelLabel: "DeepSeek V3", wins: 6, losses: 2, buchholz: 11.5, winRate: 75, status: "done" },
  { submissionId: 102, rank: 2, playerName: "选手 7311", modelLabel: "通义千问 Max", wins: 5, losses: 3, buchholz: 10.2, winRate: 62.5, status: "running" },
  { submissionId: 103, rank: 3, playerName: "选手 1190", modelLabel: "Kimi K2", wins: 5, losses: 3, buchholz: 9.8, winRate: 62.5, status: "queued" },
];

export const recentMatches = [
  {
    id: "m-2048",
    title: "商鞅 vs 旧贵族",
    subtitle: "瑞士轮第 2 轮 · 角色 A",
    result: "胜出",
    statusTone: "success" as const,
  },
  {
    id: "m-2049",
    title: "旧贵族 vs 商鞅",
    subtitle: "瑞士轮第 2 轮 · 角色 B",
    result: "判定中",
    statusTone: "warning" as const,
  },
];

export const transcript: MatchTranscriptTurn[] = [
  {
    id: "t1",
    speaker: "roleA",
    label: primaryScenario.roleAName,
    content: "法令若只为贵族而设，秦国永远无法真正富强。",
  },
  {
    id: "t2",
    speaker: "roleB",
    label: primaryScenario.roleBName,
    content: "变法若伤及宗族根基，今日得势，明日便会激起更大的反噬。",
  },
  {
    id: "t3",
    speaker: "judge",
    label: "秦孝公",
    content: "二位分别说明：你们如何定义秦国的长远利益？",
  },
];

export const dashboardStats = [
  { label: "当前排名", value: "#2" },
  { label: "总胜率", value: "62.5%" },
  { label: "已提交版本", value: "v3" },
  { label: "待运行对局", value: "04" },
];

export { modelOptions };
