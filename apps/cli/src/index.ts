import type { LeaderboardEntry, TournamentDetail, TournamentListItem } from "@axiia/shared";
import { Command } from "commander";

const API_BASE_URL = process.env.AXIIA_API_URL ?? "http://localhost:3001";
const ADMIN_TOKEN = process.env.AXIIA_ADMIN_TOKEN;

type StartRoundResponse = {
  byeSubmissions: number[];
  matches: Array<{
    id: number;
    status: string;
    subAId: number;
    subBId: number;
  }>;
  round: {
    id: number;
    roundNumber: number;
  };
  tournament: {
    id: number;
  };
};

type AdminPlayer = {
  displayName: string;
  email: string;
  model: string;
  submissionId: number;
  submittedAt: string;
  userId: number;
  version: number;
};

const program = new Command();

async function apiFetch<T>(path: string, init?: RequestInit, admin = false): Promise<T> {
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  if (admin) {
    if (!ADMIN_TOKEN) {
      throw new Error("Missing AXIIA_ADMIN_TOKEN");
    }

    headers.set("Authorization", `Bearer ${ADMIN_TOKEN}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });
  const json = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok) {
    throw new Error(json.error ?? `Request failed: ${response.status}`);
  }

  return json as T;
}

async function resolveTournamentId(input?: string) {
  if (input) {
    return Number(input);
  }

  const tournaments = await apiFetch<TournamentListItem[]>("/api/tournaments");
  const latest = tournaments[0];

  if (!latest) {
    throw new Error("No tournaments found");
  }

  return latest.id;
}

function printMatches(matches: StartRoundResponse["matches"]) {
  console.table(
    matches.map((match) => ({
      matchId: match.id,
      pairing: `${match.subAId} vs ${match.subBId}`,
      status: match.status,
    })),
  );
}

program.name("axiia").description("Axiia Cup 管理 CLI").version("0.1.0");

program
  .command("players")
  .description("查看参赛者列表")
  .requiredOption("-s, --scenario <id>", "scenario id")
  .action(async (options: { scenario: string }) => {
    const players = await apiFetch<AdminPlayer[]>(
      `/api/admin/tournaments/players?scenarioId=${encodeURIComponent(options.scenario)}`,
      { method: "GET" },
      true,
    );

    console.table(
      players.map((player) => ({
        displayName: player.displayName,
        email: player.email,
        id: player.userId,
        model: player.model,
        submittedAt: player.submittedAt,
        version: player.version,
      })),
    );
  });

program
  .command("start")
  .description("锁定报名并生成第 1 轮配对")
  .argument("<scenarioId>", "scenario id")
  .action(async (scenarioId: string) => {
    const result = await apiFetch<StartRoundResponse>(
      "/api/admin/tournaments/start",
      {
        body: JSON.stringify({ scenarioId }),
        method: "POST",
      },
      true,
    );

    console.log(`Tournament ${result.tournament.id} created`);
    console.log(`Round ${result.round.roundNumber} created`);

    if (result.byeSubmissions.length > 0) {
      console.log(`Bye: ${result.byeSubmissions.join(", ")}`);
    }

    printMatches(result.matches);
  });

program
  .command("status")
  .description("查看赛事进度")
  .argument("[tournamentId]", "tournament id")
  .action(async (tournamentIdArg?: string) => {
    const tournamentId = await resolveTournamentId(tournamentIdArg);
    const tournament = await apiFetch<TournamentDetail>(`/api/tournaments/${tournamentId}`);
    const currentRound = tournament.rounds.at(-1);

    if (!currentRound) {
      console.log(`Tournament ${tournament.id} has no rounds yet`);
      return;
    }

    const queued = currentRound.matches.filter((match) => match.status === "queued").length;
    const running = currentRound.matches.filter(
      (match) => match.status === "running" || match.status === "judging",
    ).length;
    const scored = currentRound.matches.filter((match) => match.status === "scored").length;
    const errored = currentRound.matches.filter((match) => match.status === "error").length;

    console.table([
      {
        currentRound: currentRound.roundNumber,
        errored,
        queued,
        running,
        scored,
        tournamentId: tournament.id,
      },
    ]);
  });

program
  .command("next-round")
  .description("生成下一轮瑞士轮配对")
  .argument("<tournamentId>", "tournament id")
  .action(async (tournamentId: string) => {
    const result = await apiFetch<StartRoundResponse>(
      `/api/admin/tournaments/${tournamentId}/next-round`,
      {
        method: "POST",
      },
      true,
    );

    console.log(`Round ${result.round.roundNumber} created for tournament ${result.tournament.id}`);

    if (result.byeSubmissions.length > 0) {
      console.log(`Bye: ${result.byeSubmissions.join(", ")}`);
    }

    printMatches(result.matches);
  });

program
  .command("leaderboard")
  .description("查看排行榜")
  .argument("<tournamentId>", "tournament id")
  .action(async (tournamentId: string) => {
    const leaderboard = await apiFetch<LeaderboardEntry[]>(`/api/tournaments/${tournamentId}/leaderboard`);

    console.table(
      leaderboard.map((entry) => ({
        buchholz: entry.buchholz.toFixed(1),
        losses: entry.losses,
        player: entry.playerName,
        rank: entry.rank,
        winRate: `${entry.winRate.toFixed(1)}%`,
        wins: entry.wins,
      })),
    );
  });

program.parseAsync().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unknown CLI error");
  process.exit(1);
});
