import { userSchema, type User } from "@axiia/shared";
import { z } from "zod";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const TOKEN_STORAGE_KEY = "axiia-token";

const authResponseSchema = z.object({
  token: z.string(),
  user: userSchema,
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

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
