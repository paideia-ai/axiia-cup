# Single-match PvP handoff source — 2026-09-17

The current product rule is in
[the September 17 decision](../../../docs/competition/2026-09-17-single-match-pvp.md).

The UIUX source changes are prepared and committed locally, but this account has
read-only access to `paideia-ai/axiia-cup-uiux`; push returned HTTP 403 and the
repository disallows forks. No upstream source PR or Vercel deployment is claimed.

`uiux-source.patch` contains the complete source change against UIUX main
`d677345`. It updates the current handoff guides, preserves prior clause versions
and approvals, and marks the old v3.4 paired rule superseded. It does not change
the shared review database or generated pages.

The product snapshot was generated from the clean local UIUX commit
`cc6d8fc581e528ac962869ffc927a71962f823bf`; that commit is not published upstream.
Its source content SHA-256 is
`69b3098bf4aac2124078e50f84f9d0d6b5a5fb950fc9d9a2ea11156777ff8da3`.
The patch makes those source bytes available for review and regeneration.

A UIUX maintainer can apply the patch on a new branch from current main:

```sh
git apply --unidiff-zero --check /path/to/axiia-cup/v2/specs/single-match-pvp/uiux-source.patch
git apply --unidiff-zero /path/to/axiia-cup/v2/specs/single-match-pvp/uiux-source.patch
git add UI-Doc-v3.4.md spec-v4/README.md spec-v4/sources/verification-journeys.json spec-v4/sources/verification-vivian-rest.json
git commit -m "docs: align PvP handoff with single-match policy"
```

Then run `deno task tm:sync:vivian /path/to/axiia-cup-uiux/spec-v4/sources/verification-vivian-rest.json`
from `v2/web`, followed by the same command with `--check`. This records the
maintainer's actual source commit. Do not copy the local commit ID into a new
source record. The sync script refuses an older source lacking the policy
revision, so an ordinary regeneration cannot restore the paired instructions.

Historical two-round journey snapshots remain archived. New policy pins are
pending review and do not inherit earlier human results. Current daily-count
fixture steps are blocked because points replaced those limits; the legacy
provisioning tools are not presented as points-insufficiency tests.
