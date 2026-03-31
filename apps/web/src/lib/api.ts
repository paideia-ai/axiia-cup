import {
  adminStatsSchema,
  changePasswordSchema,
  createSubmissionSchema,
  leaderboardEntrySchema,
  matchDetailSchema,
  okResponseSchema,
  playgroundRunSchema,
  playgroundRunSummarySchema,
  personalStatsSchema,
  recentMatchSchema,
  scenarioSchema,
  submissionSchema,
  tournamentDetailSchema,
  tournamentListItemSchema,
  updateProfileSchema,
  userSchema,
  type AdminStats,
  type LeaderboardEntry,
  type MatchDetail,
  type PersonalStats,
  type PlaygroundRun,
  type PlaygroundRunSummary,
  type RecentMatch,
  type Scenario,
  type Submission,
  type TournamentDetail,
  type TournamentListItem,
  type User,
} from "@axiia/shared";
import { z } from "zod";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const TOKEN_STORAGE_KEY = "axiia-token";

const authResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
const scenariosResponseSchema = z.array(scenarioSchema);
const submissionsResponseSchema = z.array(submissionSchema);
const leaderboardResponseSchema = z.array(leaderboardEntrySchema);
const tournamentsResponseSchema = z.array(tournamentListItemSchema);
const recentMatchesResponseSchema = z.array(recentMatchSchema);
const playgroundRunSummariesSchema = z.array(playgroundRunSummarySchema);

function getStoredToken() {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeToken(token: string) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function readToken() {
  return getStoredToken();
}

async function apiFetch<T>(path: string, init?: RequestInit, schema?: z.ZodType<T>): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const json = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    throw new Error(json.error ?? "Request failed");
  }

  return schema ? schema.parse(json) : (json as T);
}

export async function login(input: { email: string; password: string }): Promise<AuthResponse> {
  return apiFetch(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    authResponseSchema,
  );
}

export async function register(input: {
  displayName?: string;
  email: string;
  otp: string;
  password: string;
}): Promise<AuthResponse> {
  return apiFetch(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    authResponseSchema,
  );
}

export async function getMe(): Promise<User> {
  return apiFetch("/api/auth/me", { method: "GET" }, userSchema);
}

export async function updateProfile(input: z.input<typeof updateProfileSchema>): Promise<User> {
  const body = updateProfileSchema.parse(input);

  return apiFetch(
    "/api/auth/me",
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
    userSchema,
  );
}

export async function changePassword(input: z.input<typeof changePasswordSchema>): Promise<{ ok: true }> {
  const body = changePasswordSchema.parse(input);

  return apiFetch(
    "/api/auth/password",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    okResponseSchema,
  );
}

export async function getScenarios(): Promise<Scenario[]> {
  return apiFetch("/api/scenarios", { method: "GET" }, scenariosResponseSchema);
}

export async function getScenario(id: string): Promise<Scenario> {
  return apiFetch(`/api/scenarios/${id}`, { method: "GET" }, scenarioSchema);
}

export async function getMySubmissions(scenarioId?: string): Promise<Submission[]> {
  return apiFetch(
    scenarioId ? `/api/submissions/my/${scenarioId}` : "/api/submissions/my",
    { method: "GET" },
    submissionsResponseSchema,
  );
}

export async function createSubmission(input: z.input<typeof createSubmissionSchema>): Promise<Submission> {
  const body = createSubmissionSchema.parse(input);

  return apiFetch(
    "/api/submissions",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    submissionSchema,
  );
}

export async function runPlayground(submissionId: number): Promise<PlaygroundRun> {
  return apiFetch(
    "/api/playground/run",
    { method: "POST", body: JSON.stringify({ submissionId }) },
    playgroundRunSchema,
  );
}

export async function getPlaygroundRuns(submissionId: number): Promise<PlaygroundRunSummary[]> {
  return apiFetch(
    `/api/playground/runs/${submissionId}`,
    { method: "GET" },
    playgroundRunSummariesSchema,
  );
}

export async function getPlaygroundRun(submissionId: number, runId: number): Promise<PlaygroundRun> {
  return apiFetch(
    `/api/playground/runs/${submissionId}/${runId}`,
    { method: "GET" },
    playgroundRunSchema,
  );
}

export async function getMatch(id: number | string): Promise<MatchDetail> {
  return apiFetch(`/api/matches/${id}`, { method: "GET" }, matchDetailSchema);
}

export async function getTournament(id: number | string): Promise<TournamentDetail> {
  return apiFetch(`/api/tournaments/${id}`, { method: "GET" }, tournamentDetailSchema);
}

export async function getTournaments(): Promise<TournamentListItem[]> {
  return apiFetch("/api/tournaments", { method: "GET" }, tournamentsResponseSchema);
}

export async function getLeaderboard(tournamentId: number | string): Promise<LeaderboardEntry[]> {
  return apiFetch(`/api/tournaments/${tournamentId}/leaderboard`, { method: "GET" }, leaderboardResponseSchema);
}

export async function getMyStats(): Promise<PersonalStats> {
  return apiFetch("/api/stats/me", { method: "GET" }, personalStatsSchema);
}

export async function getAdminStats(): Promise<AdminStats> {
  return apiFetch("/api/admin/stats", { method: "GET" }, adminStatsSchema);
}

export async function getMyRecentMatches(): Promise<RecentMatch[]> {
  return apiFetch("/api/matches/my", { method: "GET" }, recentMatchesResponseSchema);
}
