# Independent PR review

`prompts/pr-review.md` is this repository's fixed review policy. The server-side
reviewer watches this repository together with `paideia-ai/axiia-cup-v2` and
`paideia-ai/axiia-cup-uiux`, using the server's existing Codex ChatGPT login.
This repository does not need an OpenAI API key or an AI GitHub Actions runner.

The initial server trial polls every 60 seconds. Each new base/head/prompt
revision is reviewed in a fresh ephemeral session with no developer conversation
or previous review. The server installs trusted prompt snapshots explicitly; a
candidate PR cannot replace the prompt used to review itself. The controller and
its deployment instructions live under `tools/pr-reviewer` in the private UI/UX
repository. This prompt file alone does not activate a server service.

The current prompt is provisional while the automatic review flow is validated.
Repository specification paths and their authority order are currently embedded
in that prompt; they will be reviewed separately from the runtime PR number and
base/head SHAs before a final configurable specification contract is agreed.

The executive report starts with a verdict and ranks material regressions,
deleted functionality and major baseline-spec violations first. It is written
in English, retaining Chinese terminology where clearer, with SHA-pinned code
and spec links for detail. The model targets 150–300 words with a 450-word cap;
the complete published comment is capped at 500 words. It does not include the
old six-section audit or an appendix. Investigation remains thorough and static;
ordinary CI executes tests. The reviewer does not approve or merge PRs.

Deploy this prompt with the controller's `reportFormat: "executive"` configuration.
Source changes alone do not update the installed reviewer.

Each eligible PR receives one updatable comment labelled as an automated Codex
review under the server's authenticated GitHub account. Its head/base SHAs and
prompt hash identify exactly what was reviewed. New revisions invalidate old
results; stale and failed reviews cannot be presented as a current clean review.
Fork PRs and drafts are skipped in this first version.
