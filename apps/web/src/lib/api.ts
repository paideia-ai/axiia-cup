import {
  createSubmissionSchema,
  leaderboardEntrySchema,
  matchDetailSchema,
  playgroundResultSchema,
  scenarioSchema,
  submissionSchema,
  tournamentDetailSchema,
  tournamentListItemSchema,
  userSchema,
  type LeaderboardEntry,
  type MatchDetail,
  type PlaygroundResult,
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

export async function runPlayground(input: z.input<typeof createSubmissionSchema>): Promise<PlaygroundResult> {
  const body = createSubmissionSchema.parse(input);

  return apiFetch(
    "/api/playground/run",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    playgroundResultSchema,
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
