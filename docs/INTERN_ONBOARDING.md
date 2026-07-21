# Welcome! Git, GitHub & Markdown in 10 Minutes

Hi! This is a quick guide to the tools we use. No experience needed — read it once, then come back whenever you forget something (everyone forgets, constantly).

## What is Git?

Git is like **save points in a video game**, but for files.

Every time you finish a piece of work, you make a **commit** — a snapshot of your files at that moment, with a short note about what you changed. If something breaks later, we can go back to any earlier save point. Nothing is ever really lost.

Words you'll hear a lot:

| Word | What it means |
|---|---|
| **Repository (repo)** | The project folder, with its entire history |
| **Commit** | One save point, with a message like "Add history debate prompts" |
| **Push** | Upload your commits to GitHub so others can see them |
| **Pull** | Download other people's latest commits to your computer |
| **Branch** | A side copy where you can work without touching the main version |
| **Pull request (PR)** | "Hey, I finished something — please review it and merge it in" |

## What is GitHub?

GitHub is a **website that stores the shared copy of the repo** (github.com). Git is the tool; GitHub is the place. Everyone's work meets there.

You've used the "Add file → Upload files" button on the website before. It works, but skip it from now on — you have Codex, and Codex is much better at this (right folder, real commit message, proper pull request). Use the website mainly for *reading*: browsing files, looking at pull requests, reading review comments.

## Always use a pull request (never commit straight to main)

`main` is the branch everyone builds on, so nothing lands there without a second pair of eyes. The flow is always:

**make a branch → commit your work there → open a pull request → someone reviews → it gets merged.**

You won't do these steps by hand — Codex will (next section). Your job is to make sure it ends in a pull request. If Codex ever proposes pushing or committing to `main` directly, say no and tell it to open a PR instead.

A PR isn't a test you can fail — it's just "here's my work, take a look." On this team, opening a PR **is** how you ask for a review: you don't need to separately message anyone or wait for permission to open one. Reviewers leaving comments is the normal way we help each other, not a sign you did badly.

Also normal: a PR sitting open for a few days or even a week before anyone reviews it. That's not you being ignored — people review in batches. Don't let an open PR block you; start your next task on a new branch while it waits.

## Your daily workflow: let Codex do the git parts

You have Codex, so you never need to run git commands yourself — you tell Codex what you want in plain English, and it does the branching, committing, and PR-opening. Your daily routine:

1. **Start fresh**: ask Codex to *"pull the latest main and make a new branch for [what you're doing]."*
2. **Do your work** — write or edit files normally.
3. **Before committing, make Codex look around first.** Don't let it guess where files go. Say something like:

   > "Look at how this repo is organized — where do markdown docs like mine belong? Tell me where you'd put this file and why, before you commit anything."

   (This matters: dropping files in the top level of the repo is how things get lost. The repo has a structure; Codex can read it in seconds.)
4. **Then commit and open a PR**: *"Commit this with a clear message describing the change, push the branch, and open a pull request. Do not push to main."*
5. **Read what Codex says it's about to do before you approve it.** You're the editor, it's the typist. If the commit message or file location looks wrong, say so — it will fix it.

Small, frequent PRs with clear messages beat one giant mystery commit at the end of the day. Codex makes each one cheap, so do them often.

## What is Markdown?

Markdown is **plain text with a few symbols for formatting**. Files end in `.md` (this guide is one!). GitHub displays them as nicely formatted pages.

```markdown
# Big heading
## Smaller heading

This is **bold** and this is *italic*.

- a bullet point
- another one

1. a numbered list
2. second item

[a link](https://example.com)
```

That's basically all of it. You can write Markdown in any text editor — TextEdit works, but **VS Code** or even Notes-style apps like **Typora** are nicer.

### Markdown, not Word. Here's why (with proof)

This one is a real rule, not a preference: **working text in this repo goes in `.md` files, not `.docx`.**

Git's superpower is showing exactly what changed between versions — but it only works on plain text. A Word file is a sealed zip archive to Git. Compare these two commits in our own repo:

- **A Word file changed:** [look at this diff](https://github.com/paideia-ai/axiia-cup/commit/ab5339029dbc266d147ebb7d66058a716cb242d5#diff-a072e8af05617a90d3d7a606c180e54d66cb26555bd258a875a30f76a9d3c998) — GitHub just says **"Binary file not shown."** That's all the information anyone will ever get. Not which prompts changed, not whether one word was fixed or the whole thing rewritten. Nothing.
- **A Markdown file changed:** [look at this diff](https://github.com/paideia-ai/axiia-cup/commit/746547b913a9e6700b1171374812e03be51bca16) — scroll to `docs/competition/DESIGN_SPEC.md`. Every removed line in red, every added line in green. You can see *precisely* what changed, and comment on any single line.

Everything downstream depends on that difference:

- **Review** — with `.md`, we can review your changes line by line and leave comments on exact spots. With `.docx`, the only possible review is "download it, open it, hunt for what's different."
- **History** — with `.md`, "what did this prompt say two weeks ago, and who changed it?" takes ten seconds. With `.docx`, it takes downloading old versions and eyeballing them side by side.
- **Merging** — if two people edit the same `.md` file, Git can usually combine both edits. Two people editing the same `.docx`? One person's work gets overwritten.

If you have content in Word already, don't retype it — ask Codex: *"Convert this .docx to a Markdown file, then figure out where in the repo it should live."* Word is fine as a final *export* for someone outside the team — it's just not where working text lives.

## What you can ask AI when you're stuck

You have three: **Codex** (in the repo, can actually do things), and **Claude** (claude.ai) / **ChatGPT** (chatgpt.com) for questions and conversations. Don't sit stuck for 30 minutes — ask early. It's not cheating; professionals do it all day.

Rough split: if the answer involves *doing something in the repo* (committing, moving files, fixing a git mess), ask Codex — it can see the actual state of things and fix them. If you just want to *understand something*, any of them works.

How to ask well:

- **Paste the exact error message.** Don't retype or summarize it — copy the whole thing.
- **Say what you were trying to do and what you already tried.**
- **Ask for an explanation, not just an answer**: "explain it like I'm new to this" works great.

Example questions that work well:

> "I'm new to Git. What's the difference between commit and push? Explain simply."

> To Codex: "Something went wrong — here's the error: (paste). Explain what happened in simple terms before fixing anything."

> To Codex: "I put a file in the wrong folder in my last commit. Move it to the right place and update the PR."

> To Codex: "What's on my branch right now that isn't in the PR yet?"

One caution: AI is sometimes confidently wrong, especially about *our specific project*. For anything about how **this** repo is organized or what a file is for — ask us first, ask AI second.

## If you think you broke something

You almost certainly didn't — that's the whole point of Git. Don't try to fix it silently; just tell us what happened. It's always recoverable, and "I messed up, help" is a completely normal message that every programmer sends regularly. 🙂
