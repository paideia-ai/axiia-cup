import { modelOptions, scenarios } from "@axiia/shared";
import { Command } from "commander";

const program = new Command();

program.name("axiia").description("Axiia Cup 管理 CLI 骨架").version("0.1.0");

program
  .command("players")
  .description("查看参赛者列表（占位）")
  .action(() => {
    console.table([
      { displayName: "选手 2048", model: "DeepSeek V3", scenario: scenarios[0]?.title ?? "-" },
      { displayName: "选手 7311", model: "通义千问 Max", scenario: scenarios[0]?.title ?? "-" },
    ]);
  });

program
  .command("start")
  .description("锁定报名并生成第 1 轮配对（占位）")
  .action(() => {
    console.log("tournament.start: scaffold only");
  });

program
  .command("status")
  .description("查看赛事进度（占位）")
  .action(() => {
    console.log("round=0 queuedMatches=0 runningMatches=0");
  });

program
  .command("next-round")
  .description("生成下一轮瑞士轮配对（占位）")
  .action(() => {
    console.log("pairing.next-round: scaffold only");
  });

program
  .command("leaderboard")
  .description("查看排行榜快照（占位）")
  .action(() => {
    console.table(
      modelOptions.map((model, index) => ({
        rank: index + 1,
        model: model.label,
        note: "shared schema wired",
      })),
    );
  });

program.parse();
