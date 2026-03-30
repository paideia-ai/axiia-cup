import { modelOptions, type PlaygroundResult } from "@axiia/shared";

import { runPlayground } from "./api";

const STORAGE_KEY = "axiia-playground-session";

export type PlaygroundDraft = {
  model: (typeof modelOptions)[number]["id"];
  promptA: string;
  promptB: string;
  scenarioId: string;
};

export type PlaygroundSessionState = {
  completedAt: number | null;
  draft: PlaygroundDraft | null;
  error: string | null;
  result: PlaygroundResult | null;
  startedAt: number | null;
  status: "idle" | "running" | "success" | "error";
};

const defaultDraft: PlaygroundDraft = {
  model: modelOptions[0]!.id,
  promptA: "",
  promptB: "",
  scenarioId: "",
};

const defaultState: PlaygroundSessionState = {
  completedAt: null,
  draft: defaultDraft,
  error: null,
  result: null,
  startedAt: null,
  status: "idle",
};

let activeRun: Promise<void> | null = null;
let currentRunToken = 0;
const listeners = new Set<(state: PlaygroundSessionState) => void>();

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function readPersistedState(): PlaygroundSessionState {
  if (!canUseStorage()) {
    return defaultState;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return defaultState;
    }

    const parsed = JSON.parse(raw) as PlaygroundSessionState;

    if (parsed.status === "running") {
      return {
        ...parsed,
        completedAt: Date.now(),
        error: "上一次试炼场运行未完成，请重新发起。",
        status: "error",
      };
    }

    return {
      ...defaultState,
      ...parsed,
      draft: parsed.draft ? { ...defaultDraft, ...parsed.draft } : defaultDraft,
    };
  } catch {
    return defaultState;
  }
}

let state = readPersistedState();

function persistState() {
  if (!canUseStorage()) {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function emit() {
  persistState();

  for (const listener of listeners) {
    listener(state);
  }
}

function setState(nextState: PlaygroundSessionState) {
  state = nextState;
  emit();
}

export function getPlaygroundSessionState() {
  return state;
}

export function subscribePlaygroundSession(listener: (state: PlaygroundSessionState) => void) {
  listeners.add(listener);
  listener(state);

  return () => {
    listeners.delete(listener);
  };
}

export function clearPlaygroundSession(draft?: PlaygroundDraft) {
  currentRunToken += 1;
  activeRun = null;
  setState({
    ...defaultState,
    draft: draft ?? defaultDraft,
  });
}

export function startPlaygroundSession(draft: PlaygroundDraft) {
  if (activeRun) {
    return activeRun;
  }

  currentRunToken += 1;
  const runToken = currentRunToken;
  const startedAt = Date.now();

  setState({
    completedAt: null,
    draft,
    error: null,
    result: null,
    startedAt,
    status: "running",
  });

  activeRun = runPlayground(draft)
    .then((result) => {
      if (currentRunToken !== runToken) {
        return;
      }

      setState({
        completedAt: Date.now(),
        draft,
        error: null,
        result,
        startedAt,
        status: "success",
      });
    })
    .catch((error) => {
      if (currentRunToken !== runToken) {
        return;
      }

      setState({
        completedAt: Date.now(),
        draft,
        error: error instanceof Error ? error.message : "试炼场运行失败",
        result: null,
        startedAt,
        status: "error",
      });
    })
    .finally(() => {
      if (currentRunToken === runToken) {
        activeRun = null;
      }
    });

  return activeRun;
}
