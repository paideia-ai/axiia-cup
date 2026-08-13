#!/usr/bin/env node

import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..')
const outputDir = path.join(repoRoot, 'docs/analysis/feedback-audit')
const inputPath = path.join(outputDir, 'feedback-audit.json')
const jsonPath = path.join(outputDir, 'feedback-compliance.json')
const htmlPath = path.join(outputDir, 'feedback-compliance.html')
const auditHtmlPath = path.join(outputDir, 'feedback-audit.html')
const indexPath = path.join(outputDir, 'index.html')

const source = JSON.parse(await readFile(inputPath, 'utf8'))

const heads = {
  frontend: {
    repository: 'paideia-ai/axiia-cup',
    pull_request: 97,
    url: 'https://github.com/paideia-ai/axiia-cup/pull/97',
    branch: 'v2/p4f-replay',
    head_sha: 'd2cf1076b0b2b2255de2741ee7c7b6e57b4cdfcf',
    status: 'open',
    stacked_on: [94, 95, 96],
    checked_at: '2026-08-12',
  },
  backend: {
    repository: 'paideia-ai/axiia-cup-v2',
    pull_request: 5,
    url: 'https://github.com/paideia-ai/axiia-cup-v2/pull/5',
    branch: 'p2-gates-config',
    head_sha: '7be8f7a0914ac2d96deba933769bd08e8e800a8b',
    status: 'open',
    stacked_on: [4],
    checked_at: '2026-08-12',
  },
  specification: {
    path: '/home/ubuntu/axiia-cup-uiux/UI-Doc-v3.4.md',
    url: 'https://deploy-v2-ebon-beta.vercel.app/v3-4',
    version: '3.4',
    status: 'CONFIRMED',
  },
}

const specSectionByArea = {
  'Agent architecture': '§−2 #55–#66 · §0 · B3',
  'Rankings & tournaments': 'A6 · B4 · C3',
  'Navigation & information architecture': 'A1 · B8 · C3',
  'Landing & public sharing': 'A7 · B1',
  'Registration & onboarding': 'A3 · B2',
  'Scenario discovery': 'A4',
  'Prompt builder': 'A2 · A3 · §−2 #68',
  'Agents & version management': '§−2 #70/#75 · B3',
  'Opponent selection & PVP': 'A5 · A6 · §−2 #65–#79',
  'Battle queue & live view': 'A1 · A5 · §−2 #72',
  'Battle report & replay': 'A7 · §−2 #20–#26/#67/#69/#71/#80',
  'Notifications & settings': 'B5 · B6',
  'Documentation & design process': '§−1 · C1–C4',
  'Safety, cost & integrity': 'A3 · A6 · C2',
  'Mobile & responsive UI': 'A1 · A5 · B8',
  'Operations & testing': 'C4',
  'Scenario details': 'A4 · C1',
  'Rankings, history & settings': 'B4 · B6 · B7 · B8',
}

const outOfScope = new Set([
  'vote-note:1',
  'vote-note:56',
  'comment:3',
  'comment:4',
  'comment:11',
  'comment:12',
  'comment:13',
  'comment:45',
  'comment:52',
  'comment:55',
  'comment:61',
  'comment:62',
  'vote-note:223',
  'vote-note:288',
  'vote-note:322',
  'vote-note:350',
])

const contradicts = new Set([
  'comment:1',
  'vote-note:64',
  'vote-note:127',
  'vote-note:130',
  'vote-note:226',
  'vote-note:263',
  'vote-note:274',
  'vote-note:296',
  'comment:7',
  'comment:16',
  'comment:60',
])

const different = new Set([
  'comment:6',
  'comment:22',
  'comment:29',
  'comment:40',
  'comment:41',
  'comment:49',
  'vote-note:152',
  'vote-note:167',
  'vote-note:246',
  'vote-note:249',
  'vote-note:266',
  'vote-note:269',
  'vote-note:309',
  'vote-note:314',
  'vote-note:318',
  'vote-note:338',
])

const notInSpec = new Set([
  'comment:26',
  'comment:27',
  'comment:30',
  'comment:31',
  'comment:32',
  'comment:33',
  'comment:34',
  'comment:35',
  'comment:36',
  'comment:50',
  'comment:64',
  'comment:65',
  'comment:66',
  'comment:67',
])

const specNotes = {
  'comment:1': 'The final architecture is the opposite: agents and versions are per-side, not one combined two-sided agent.',
  'comment:6': 'v3.4 resolves the one-sided concern with per-side agents and a separate two-side completion gate, not by choosing a side per round.',
  'vote-note:64': 'v3.4 explicitly overturns the combined-agent choice even though versions can represent different strategies.',
  'vote-note:127': 'The final builder explicitly provides no in-product multi-turn chat; it offers MCQ, Basic, and a copyable prompt-builder prompt.',
  'vote-note:130': 'MCQ is required for every scenario, while visual deck/card authoring is deferred; it is not a one-scenario visual-deck pilot.',
  'vote-note:152': 'The progress-state idea remains, but the final default is one distinct PVE-NPC win on each side, not 2–3 wins in one undifferentiated gate.',
  'vote-note:167': 'v3.4 keeps generated judge OS summaries and also requires real thinking traces behind debug mode, so it is broader than “summaries, not raw trace.”',
  'vote-note:246': 'The cost concern changed the design, but final v3.4 keeps generated judge OS public and real traces in debug; visibility is not simply “summary private from opponents.”',
  'vote-note:249': 'v3.4 goes beyond a narrative-only trust boundary: it requires exact weights to be public and supports structured scoring plus LLM prose.',
  'vote-note:263': 'v3.4 optimizes first-battle start, but also explicitly allows tournament operations to block all trials, so it does not promise an always-available express battle.',
  'vote-note:266': 'The daily cost cap survives, but anti-injection does not: v3.4 explicitly says judge injection protection is unnecessary.',
  'vote-note:269': 'v3.4 preserves judgeOsPrompt secrecy but explicitly publishes exact scoring weights, so the proposed “do not expose every weight” middle ground was not adopted.',
  'vote-note:274': 'Final v3.4 says shared reports need no redaction and mobile should work normally; both parts differ from this proposal.',
  'vote-note:296': 'v3.4 resolves ranking as the G hub with GT/GP tabs and explicitly has no independent J page.',
  'vote-note:309': 'v3.4 requires faithful display and system support for structured scoring, but lets each scenario choose structured scoring or LLM prose rather than mandating one universal pipeline.',
  'vote-note:314': 'The note called the guided-empty-state choice non-final; v3.4 subsequently retains guided empty states as a cross-cutting pattern.',
  'vote-note:318': 'The five-way sketch was not taken verbatim: v3.4 specifies PVE, three PVP discovery modes, and hotseat, while parts of automatic/top-player design remain W11 work.',
  'vote-note:338': 'The underlying trust issue was not wholly discarded: v3.4 requires exact weights and faithful score presentation, while rejecting model confounding as a ranking problem.',
  'comment:7': 'The “maintain current combined versioning” decision is explicitly overturned by #55–#57.',
  'comment:16': 'The “maintain current combined agent” position is explicitly overturned by the per-side reversal.',
  'comment:22': 'Distinct still means different NPC opponents per scenario, but v3.4 adds a separate per-side threshold.',
  'comment:29': 'The 44px accessibility requirement is absent, and final A5 still names PVE, PVP-by-id, top-player, automatic matching, plus hotseat rather than collapsing the information architecture to two top-level choices.',
  'comment:40': 'v3.4 moves “My agents” out of scenario cards into a global first-level destination; D is intentionally pure scenario discovery.',
  'comment:41': 'v3.4 requires gate progress in the OS panel; it does not require that progress string on every scenario card.',
  'comment:49': 'Debug mode belongs to the battle report, not settings. The accessibility part about unnamed settings switches is not specified.',
  'comment:60': 'Final #75 explicitly requires both a prominent page-header Edit and per-version Edit-this-version controls.',
  'comment:26': 'v3.4 says mobile should work and reserves space for mobile navigation in broad terms, but it does not specify the measured agent-row/safe-area repair described here.',
  'comment:27': 'The exact CTA overlap and safe-area remedy are implementation requirements absent from v3.4.',
  'comment:30': 'v3.4 fixes report order but does not require a sticky section index, default folding, swipe hints, or actionable improvement summaries.',
  'comment:32': 'v3.4 defines builder modes and controls but contains no keyboard/screen-reader semantics for labels, tabs, or MCQ selections.',
  'comment:33': 'v3.4 requires the repeated version actions but does not specify version-specific accessible names.',
  'comment:34': 'v3.4 requires the My Agents destination and dual-side guidance but not object-specific accessible action names.',
  'comment:35': 'Notification preferences are in B6, but switch roles, accessible names, and checked/disabled semantics are not specified.',
  'comment:36': 'v3.4 says saving creates a version; it does not define this proposed interaction for choosing or defaulting the target version.',
  'comment:64': 'v3.4 does not define a one-way transition that permanently disables MCQ after a manual edit.',
  'comment:65': 'v3.4 defines modes per version but does not say MCQ can only start a new line of iteration.',
  'comment:66': 'v3.4 does not define attaching an existing version to a new MCQ-generated prompt.',
  'comment:67': 'v3.4 defines debug visibility, not a bottom-frame placement or discovery hint on the toggle.',
}

function specStatus(record) {
  if (outOfScope.has(record.record_id)) return 'out_of_scope'
  if (contradicts.has(record.record_id)) return 'contradicts'
  if (different.has(record.record_id)) return 'different'
  if (notInSpec.has(record.record_id)) return 'not_in_spec'
  return 'reflected'
}

function specRationale(record, status, section) {
  if (specNotes[record.record_id]) return specNotes[record.record_id]
  if (status === 'out_of_scope') {
    return 'This is a test row, assignment/process note, scenario-copy question, or implementation observation rather than a normative product decision for v3.4.'
  }
  if (status === 'contradicts') {
    return `v3.4 makes the opposite final decision in ${section}.`
  }
  if (status === 'different') {
    return `v3.4 carries part of the intent but materially changes the value, scope, placement, or behavior in ${section}.`
  }
  if (status === 'not_in_spec') {
    return `No matching normative requirement was found in v3.4; ${section} is the nearest related section.`
  }
  return `The decision is explicitly represented in v3.4 under ${section}.`
}

const screenshotsByArea = {
  'Agent architecture': ['screenshots/pr97-my-agents.png', 'screenshots/pr97-agent-view.png'],
  'Rankings & tournaments': ['screenshots/pr97-rankings.png'],
  'Navigation & information architecture': ['screenshots/pr97-scenarios.png', 'screenshots/pr97-my-agents-mobile.png'],
  'Landing & public sharing': ['screenshots/pr97-landing.png', 'screenshots/pr97-report.png'],
  'Registration & onboarding': ['screenshots/pr97-registration.png', 'screenshots/pr97-scenarios.png'],
  'Scenario discovery': ['screenshots/pr97-scenarios.png', 'screenshots/pr97-scenarios-mobile.png'],
  'Prompt builder': ['screenshots/pr97-builder.png'],
  'Agents & version management': ['screenshots/pr97-agent-view.png', 'screenshots/pr97-agent-view-mobile.png'],
  'Opponent selection & PVP': ['screenshots/pr97-os-panel.png', 'screenshots/pr97-os-panel-pvp.png', 'screenshots/pr97-os-panel-mobile.png'],
  'Battle queue & live view': ['screenshots/pr97-os-panel.png', 'screenshots/pr97-history.png'],
  'Battle report & replay': ['screenshots/pr97-report.png', 'screenshots/pr97-report-debug.png'],
  'Notifications & settings': ['screenshots/pr97-notifications.png', 'screenshots/pr97-settings.png'],
  'Safety, cost & integrity': ['screenshots/pr97-os-panel-pvp.png', 'screenshots/pr97-builder.png'],
  'Mobile & responsive UI': ['screenshots/pr97-my-agents-mobile.png', 'screenshots/pr97-os-panel-mobile.png', 'screenshots/pr97-scenario-detail-mobile.png'],
  'Scenario details': ['screenshots/pr97-scenario-detail.png', 'screenshots/pr97-scenario-detail-mobile.png'],
  'Rankings, history & settings': ['screenshots/pr97-rankings.png', 'screenshots/pr97-history.png', 'screenshots/pr97-settings.png'],
}

const frontendDefault = {
  'Agent architecture': 'partial',
  'Rankings & tournaments': 'partial',
  'Navigation & information architecture': 'partial',
  'Landing & public sharing': 'not_reflected',
  'Registration & onboarding': 'not_reflected',
  'Scenario discovery': 'partial',
  'Prompt builder': 'partial',
  'Agents & version management': 'partial',
  'Opponent selection & PVP': 'partial',
  'Battle queue & live view': 'not_reflected',
  'Battle report & replay': 'partial',
  'Notifications & settings': 'partial',
  'Safety, cost & integrity': 'partial',
  'Mobile & responsive UI': 'partial',
  'Scenario details': 'partial',
  'Rankings, history & settings': 'partial',
}

const frontendReflected = new Set([
  'vote-note:92',
  'vote-note:112',
  'vote-note:167',
  'vote-note:180',
  'vote-note:307',
  'comment:8',
  'comment:9',
  'comment:14',
  'comment:21',
  'comment:23',
  'comment:24',
  'comment:25',
  'comment:28',
  'comment:38',
  'comment:39',
  'comment:42',
  'comment:46',
  'comment:47',
  'comment:48',
  'comment:54',
  'comment:56',
])

const frontendNotReflected = new Set([
  'vote-note:102',
  'vote-note:105',
  'vote-note:110',
  'vote-note:195',
  'vote-note:217',
  'vote-note:242',
  'vote-note:263',
  'vote-note:325',
  'comment:10',
  'comment:15',
  'comment:27',
  'comment:30',
  'comment:32',
  'comment:33',
  'comment:35',
  'comment:36',
  'comment:44',
  'comment:51',
  'comment:58',
  'comment:59',
  'comment:63',
  'comment:64',
  'comment:65',
  'comment:66',
  'comment:67',
])

const frontendPartial = new Set([
  'vote-note:30',
  'vote-note:33',
  'vote-note:77',
  'vote-note:139',
  'vote-note:152',
  'vote-note:155',
  'vote-note:158',
  'vote-note:186',
  'vote-note:231',
  'vote-note:246',
  'vote-note:249',
  'vote-note:266',
  'vote-note:269',
  'vote-note:302',
  'vote-note:309',
  'vote-note:332',
  'vote-note:340',
  'comment:17',
  'comment:18',
  'comment:22',
  'comment:26',
  'comment:29',
  'comment:31',
  'comment:34',
  'comment:37',
  'comment:40',
  'comment:41',
  'comment:49',
  'comment:50',
])

const futureIntentional = new Set([
  'vote-note:43',
  'vote-note:69',
  'vote-note:127',
  'vote-note:130',
  'vote-note:274',
  'vote-note:296',
  'comment:1',
  'comment:7',
  'comment:16',
  'comment:60',
])

const frontendRationaleByArea = {
  'Agent architecture': 'The PR uses per-side agents and shows two-side completion/entry state, but does not support multiple agents per side or the same-side second-agent gate.',
  'Rankings & tournaments': 'A tournament list/standings surface exists and honestly labels player ladder as later; the GT round timeline and GP ladder are not implemented.',
  'Navigation & information architecture': 'Desktop/mobile global navigation, My Agents, History, bell, and settings entry are present; the specified E → OS transition and ongoing-dispatch strip are not.',
  'Landing & public sharing': 'The landing page remains a generic three-step marketing page; there are no real match excerpts, showcase matches, top players, totals, or public share route.',
  'Registration & onboarding': 'Registration auto-login is wired, but it lands at /scenarios; simplified DA, express MCQ, easiest-NPC auto-dispatch, direct live view, and the bottom first-battle CTA are absent.',
  'Scenario discovery': 'Scenario cards are semantic links and show difficulty/time/novice/gate state, but several v3.4 discovery and server-data details remain partial.',
  'Prompt builder': 'The builder has one strategy textarea, model selector, 1000-unit counter, Save, and readonly role template. MCQ, Basic/meta mode tabs, and mode-switch semantics are absent.',
  'Agents & version management': 'The page has header Edit, per-version Edit, entry-version marking, IDs, and diff. Per-version W/L is absent and repeated controls lack version-specific accessible names.',
  'Opponent selection & PVP': 'The OS modal has PVE/hotseat/PVP gate progress, but player challenge is explicitly “next version”; paired PVP, by-ID/top/auto modes, opponent version choice, and 44px targets are absent.',
  'Battle queue & live view': 'History exists, but the collapsible, empty-hiding, mobile-horizontal ongoing battle strip is not rendered at dispatch.',
  'Battle report & replay': 'Result-first order, dialogue, inquiry, score derivation, generated judge OS, debug trace folds, and replay exist. The five-step hidden-goal block, opponent return link, compact section navigation/folding, and improvement summary are missing.',
  'Notifications & settings': 'A persistent bell and battle-finished list exist, but only one notification kind is rendered; clearing/grouping, seven other kinds, and notification preferences are absent.',
  'Safety, cost & integrity': 'The UI reads limits/progress from config and shows usage, while backend enforcement remains open-PR code with known review blockers; anti-injection is intentionally absent per v3.4.',
  'Mobile & responsive UI': 'The latest My Agents cards no longer collapse names into vertical text and bottom-nav spacing is improved; OS close/tab targets remain below 44px and the first-battle flow itself is missing.',
  'Scenario details': 'A four-layer educational page exists with difficulty, sides, judge summary, scoring, and deep reading, but narrative/raw toggle and multiple W2 fields are absent; content is still frontend-module data.',
  'Rankings, history & settings': 'History rows now deep-link to their own reports and ranking uses an honest future state; settings contains only account/admin elevation, not notification preferences or the reviewed switches.',
}

function frontendStatus(record, status) {
  if (status === 'out_of_scope') return 'not_applicable'
  if (futureIntentional.has(record.record_id)) return 'intentionally_not_implemented'
  if (frontendReflected.has(record.record_id)) return 'reflected'
  if (frontendNotReflected.has(record.record_id)) return 'not_reflected'
  if (frontendPartial.has(record.record_id)) return 'partial'
  return frontendDefault[record.area] ?? 'not_applicable'
}

function frontendRationale(record, implementationStatus, spec) {
  const base = frontendRationaleByArea[record.area] ?? 'This record does not map to a user-visible frontend requirement.'
  if (implementationStatus === 'not_applicable') return 'No frontend behavior can be validated for this test, assignment/process note, or scenario-content-only observation.'
  if (implementationStatus === 'intentionally_not_implemented') {
    return `The requested alternative is not present; this is consistent with the final v3.4 disposition (${spec.status}). ${base}`
  }
  return base
}

const backendDefault = {
  'Agent architecture': 'partial',
  'Rankings & tournaments': 'partial',
  'Navigation & information architecture': 'not_applicable',
  'Landing & public sharing': 'not_applicable',
  'Registration & onboarding': 'partial',
  'Scenario discovery': 'partial',
  'Prompt builder': 'partial',
  'Agents & version management': 'partial',
  'Opponent selection & PVP': 'partial',
  'Battle queue & live view': 'partial',
  'Battle report & replay': 'partial',
  'Notifications & settings': 'not_reflected',
  'Safety, cost & integrity': 'partial',
  'Mobile & responsive UI': 'not_applicable',
  'Scenario details': 'partial',
  'Rankings, history & settings': 'partial',
}

const backendReflected = new Set([
  'vote-note:180',
  'comment:21',
  'comment:22',
  'comment:23',
  'comment:24',
  'comment:25',
  'comment:42',
  'comment:46',
  'comment:48',
  'comment:53',
  'comment:56',
  'comment:57',
])

const backendNotReflected = new Set([
  'vote-note:30',
  'vote-note:33',
  'vote-note:77',
  'vote-note:139',
  'vote-note:186',
  'vote-note:195',
  'vote-note:217',
  'comment:15',
  'comment:18',
  'comment:36',
  'comment:44',
  'comment:58',
  'comment:63',
  'comment:64',
  'comment:65',
  'comment:66',
])

const backendEvidenceByArea = {
  'Agent architecture': ['AxiiaStore/Sources/Agents.swift', 'AxiiaServer/Sources/ConfigRoutes.swift'],
  'Rankings & tournaments': ['AxiiaServer/Sources/TournamentRoutes.swift', 'AxiiaStore/Sources/Tournaments.swift'],
  'Registration & onboarding': ['AxiiaServer/Sources/ConfigRoutes.swift'],
  'Scenario discovery': ['AxiiaServer/Sources/CatalogRoutes.swift', 'AxiiaStore/Sources/Progression.swift'],
  'Prompt builder': ['AxiiaServer/Sources/BuilderRoutes.swift', 'AxiiaDomain/Sources/PromptLength.swift'],
  'Agents & version management': ['AxiiaStore/Sources/Agents.swift', 'AxiiaServer/Sources/BuilderRoutes.swift'],
  'Opponent selection & PVP': ['AxiiaServer/Sources/MatchRoutes.swift', 'AxiiaStore/Sources/Progression.swift', 'AxiiaStore/Sources/Dispatches.swift'],
  'Battle queue & live view': ['AxiiaServer/Sources/MatchRoutes.swift', 'AxiiaStore/Sources/Dispatches.swift'],
  'Battle report & replay': ['AxiiaServer/Sources/MatchRoutes.swift', 'AxiiaStore/Sources/Battles.swift'],
  'Notifications & settings': ['AxiiaStore/Sources/Notifications.swift', 'AxiiaServer/Sources/NotificationRoutes.swift'],
  'Safety, cost & integrity': ['AxiiaServer/Sources/MatchRoutes.swift', 'AxiiaStore/Sources/Dispatches.swift', 'AxiiaDomain/Sources/PromptLength.swift'],
  'Scenario details': ['AxiiaServer/Sources/CatalogRoutes.swift'],
  'Rankings, history & settings': ['AxiiaServer/Sources/TournamentRoutes.swift', 'AxiiaServer/Sources/MatchRoutes.swift'],
}

const backendRationaleByArea = {
  'Agent architecture': 'The data model is per-side and inventory/entry readiness is projected, but ensureAgent is get-or-create; multiple agents per side and the #59/#79 creation gate are not implemented.',
  'Rankings & tournaments': 'Tournament storage/routes exist, but player×scenario GP ladder/MMR and qualification linkage are not implemented.',
  'Registration & onboarding': 'The config endpoint exposes an express preset, but there is no backend-owned orchestration proving simplified DA → save → easiest NPC → direct-live express flow.',
  'Scenario discovery': 'Catalog responses expose per-side gate progress; scenario educational content and several discovery fields remain frontend-owned rather than server-driven.',
  'Prompt builder': 'Save enforces a nominal 1000-unit limit and stores model/version data. PR review found the counter misses several scripts/emoji and mutate has no equivalent limit; MCQ/meta modes are not server features.',
  'Agents & version management': 'Versions, entry marking, draft, and diff are supported; per-version W/L and multi-agent-per-side semantics are absent.',
  'Opponent selection & PVP': 'Both-party per-side gates, hotseat bypass, and quotas exist, but one PVP request creates one match—not the required paired two-match challenge—and no opponent-repeat limit is enforced.',
  'Battle queue & live view': 'Dispatch reservations and quota accounting exist. Open PR review identifies reservation leak/orphan-match paths that can permanently consume concurrency or create unmetered work.',
  'Battle report & replay': 'Viewer-filtered reasoning supports public judge/NPC traces and owner-only player trace. Replay and report organization are frontend-only; paired report IDs do not exist because paired PVP is absent.',
  'Notifications & settings': 'Persistence, bell SSE, read state, and battle_finished exist; the other seven notification kinds, grouping, and clear are not implemented.',
  'Safety, cost & integrity': 'Daily/PVP/concurrency quota code is present, but review found two reservation-compensation blockers and a bypassable prompt-length algorithm. Anti-injection is intentionally not required by v3.4.',
  'Scenario details': 'Catalog exposes scenario descriptors/presets, but the frontend still owns most educational copy; narrative/raw and full W2 fields are not represented end to end.',
  'Rankings, history & settings': 'Match history and tournament standings exist; GP ladder and settings preferences are absent.',
}

function backendStatus(record, spec) {
  if (spec === 'out_of_scope') return 'not_applicable'
  if (contradicts.has(record.record_id)) return 'intentionally_not_implemented'
  if (backendReflected.has(record.record_id)) return 'reflected'
  if (backendNotReflected.has(record.record_id)) return 'not_reflected'
  return backendDefault[record.area] ?? 'not_applicable'
}

function backendRationale(record, implementationStatus, spec) {
  const base = backendRationaleByArea[record.area] ?? 'This record is a frontend, process, or scenario-content concern with no direct backend acceptance criterion.'
  if (implementationStatus === 'not_applicable') return 'No backend behavior can be validated for this UI-only, process-only, test, or scenario-content-only record.'
  if (implementationStatus === 'intentionally_not_implemented') {
    return `The rejected alternative is not implemented, consistent with v3.4 (${spec.status}). ${base}`
  }
  return base
}

const backendReviewFindings = [
  {
    severity: 'blocker',
    title: 'Deployed beta gate may be impossible',
    detail: 'PR #5 changes the code default to 1, but the reviewed beta environment remains PVE_REQUIRED_WINS=3 while most scenarios expose only two presets per side.',
  },
  {
    severity: 'blocker',
    title: 'Dispatch reservation leak',
    detail: 'Best-effort compensation can leave an unbound reservation that permanently consumes an in-flight concurrency slot.',
  },
  {
    severity: 'blocker',
    title: 'Orphan match after enqueue failure',
    detail: 'A match row can survive while quota compensation removes its reservation, allowing later execution without metering.',
  },
  {
    severity: 'blocker',
    title: 'Prompt limit is bypassable',
    detail: 'The counter covers CJK ideographs and ASCII word runs only; kana, Hangul, Cyrillic, emoji, punctuation, and long unbroken ASCII can evade the intended 1000-unit limit, and mutate has no limit.',
  },
]

const records = source.records.map((record) => {
  const status = specStatus(record)
  const section = specSectionByArea[record.area] ?? 'No direct section'
  const spec = {
    status,
    section,
    rationale: specRationale(record, status, section),
    source: heads.specification,
  }
  const frontStatus = frontendStatus(record, status)
  const screenshots = screenshotsByArea[record.area] ?? []
  const backendImplementationStatus = backendStatus(record, status)
  return {
    ...record,
    v34_comparison: spec,
    implementation: {
      frontend: {
        status: frontStatus,
        rationale: frontendRationale(record, frontStatus, spec),
        pull_request: heads.frontend,
        screenshots,
      },
      backend: {
        status: backendImplementationStatus,
        rationale: backendRationale(record, backendImplementationStatus, spec),
        pull_request: heads.backend,
        evidence: backendEvidenceByArea[record.area] ?? [],
      },
    },
  }
})

if (records.length !== 112) throw new Error(`Expected 112 records, found ${records.length}`)
const idSet = new Set(records.map((record) => record.record_id))
if (idSet.size !== records.length) throw new Error('Duplicate record_id detected')

for (const record of records) {
  const front = record.implementation.frontend
  if (front.status === 'partial' || front.status === 'not_reflected') {
    if (front.screenshots.length === 0) {
      throw new Error(`${record.record_id} is a frontend gap without a screenshot group`)
    }
    for (const relative of front.screenshots) {
      if (!existsSync(path.join(outputDir, relative))) {
        throw new Error(`${record.record_id} references missing screenshot ${relative}`)
      }
    }
  }
}

function countBy(items, selector) {
  return items.reduce((counts, item) => {
    const value = selector(item)
    counts[value] = (counts[value] ?? 0) + 1
    return counts
  }, {})
}

const summary = {
  total: records.length,
  spec: countBy(records, (record) => record.v34_comparison.status),
  frontend: countBy(records, (record) => record.implementation.frontend.status),
  backend: countBy(records, (record) => record.implementation.backend.status),
  divergent_from_v34: records.filter((record) =>
    ['not_in_spec', 'contradicts', 'different'].includes(record.v34_comparison.status)
  ).length,
  frontend_gaps: records.filter((record) =>
    ['partial', 'not_reflected'].includes(record.implementation.frontend.status)
  ).length,
}

const report = {
  schema_version: '2.0',
  title: 'Axiia Cup feedback compliance audit — v3.4 and latest open PRs',
  generated_at: new Date().toISOString(),
  scope: {
    record_count: 112,
    specification: heads.specification,
    frontend: heads.frontend,
    backend: heads.backend,
    caveat: 'Both implementation heads are open PRs. “Reflected” means present at the inspected immutable head, not merged or deployed to production.',
  },
  methodology: {
    spec_statuses: {
      reflected: 'v3.4 explicitly carries the same decision.',
      different: 'v3.4 retains part but changes material value/scope/placement/behavior.',
      contradicts: 'v3.4 makes the opposite final decision.',
      not_in_spec: 'No matching normative requirement was found in v3.4.',
      out_of_scope: 'Test/process/assignment/scenario-copy/implementation-only note, not a product-spec decision.',
    },
    implementation_statuses: {
      reflected: 'Requirement is visible/supported at the inspected PR head.',
      partial: 'Some required behavior exists; material portions are absent or risky.',
      not_reflected: 'No implementation of the requirement was found at the inspected PR head.',
      intentionally_not_implemented: 'Alternative is absent consistently with a final spec rejection/future decision.',
      not_applicable: 'No meaningful acceptance criterion exists in that layer.',
    },
    screenshot_method: 'The exact frontend head was run with Vite against a deterministic read-only fixture API. Desktop and mobile routes were captured with agent-browser; screenshots prove visible state, not production deployment.',
    backend_method: 'The exact backend head and its stacked PR #4 were inspected. GitHub CI is green, but Bazel/Swift were unavailable locally. Open PR review blockers are preserved below.',
  },
  summary,
  verification: {
    frontend: {
      head: heads.frontend,
      browser_errors: [],
      console_findings: [
        'Builder model Select changes from uncontrolled to controlled after async model loading (Base UI console error).',
      ],
      screenshot_directory: 'screenshots/',
    },
    backend: {
      head: heads.backend,
      github_ci: 'green at inspected head',
      local_execution: 'not run: Bazel and Swift toolchains were unavailable',
      review_findings: backendReviewFindings,
    },
  },
  records,
}

await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`)

const escapeHTML = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const label = {
  reflected: 'Reflected',
  different: 'Different',
  contradicts: 'Contradicts',
  not_in_spec: 'Not in v3.4',
  out_of_scope: 'Out of scope',
  partial: 'Partial',
  not_reflected: 'Not reflected',
  intentionally_not_implemented: 'Intentional absence',
  not_applicable: 'N/A',
}

const badge = (status) => `<span class="badge s-${escapeHTML(status)}">${escapeHTML(label[status] ?? status)}</span>`
const countPills = (counts) => Object.entries(counts)
  .map(([status, count]) => `<button class="count" data-filter="${escapeHTML(status)}">${badge(status)} <strong>${count}</strong></button>`)
  .join('')

const screenshotHTML = (screenshots) => screenshots.map((relative) => `
  <a class="shot" href="${escapeHTML(relative)}" target="_blank" rel="noreferrer">
    <img src="${escapeHTML(relative)}" alt="Screenshot proof: ${escapeHTML(path.basename(relative))}" loading="lazy">
    <span>${escapeHTML(path.basename(relative))}</span>
  </a>`).join('')

const cards = records.map((record) => {
  const spec = record.v34_comparison
  const front = record.implementation.frontend
  const backend = record.implementation.backend
  const search = [record.record_id, record.author, record.area, record.text, spec.rationale, front.rationale, backend.rationale].join(' ').toLowerCase()
  return `
<article class="record" data-spec="${escapeHTML(spec.status)}" data-front="${escapeHTML(front.status)}" data-back="${escapeHTML(backend.status)}" data-search="${escapeHTML(search)}">
  <header class="record-head">
    <div>
      <span class="record-id">${escapeHTML(record.record_id)}</span>
      <span class="meta">${escapeHTML(record.date)} · ${escapeHTML(record.author)} · ${escapeHTML(record.kind)}</span>
    </div>
    <span class="area">${escapeHTML(record.area)}</span>
  </header>
  <blockquote>${escapeHTML(record.text)}</blockquote>
  <div class="triage">
    <section>
      <h3>v3.4 ${badge(spec.status)}</h3>
      <p class="ref">${escapeHTML(spec.section)}</p>
      <p>${escapeHTML(spec.rationale)}</p>
    </section>
    <section>
      <h3>Frontend PR #97 ${badge(front.status)}</h3>
      <p>${escapeHTML(front.rationale)}</p>
      <div class="shots">${screenshotHTML(front.screenshots)}</div>
    </section>
    <section>
      <h3>Backend PR #5 ${badge(backend.status)}</h3>
      <p>${escapeHTML(backend.rationale)}</p>
      ${backend.evidence.length ? `<p class="ref">${backend.evidence.map(escapeHTML).join(' · ')}</p>` : ''}
    </section>
  </div>
  <details>
    <summary>Original audit disposition and source</summary>
    <p>${badge(record.assessment.disposition)} ${escapeHTML(record.assessment.rationale)}</p>
    <p class="ref">Progress: ${escapeHTML(record.assessment.progress.label)} · ${escapeHTML(record.assessment.progress.detail)}</p>
    <p class="ref">${escapeHTML(record.source.label)}${record.source.card_title ? ` · ${escapeHTML(record.source.card_title)}` : ''}</p>
  </details>
</article>`
}).join('\n')

const blockers = backendReviewFindings.map((finding) => `
  <li><strong>${escapeHTML(finding.title)}</strong><span>${escapeHTML(finding.detail)}</span></li>`).join('')

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHTML(report.title)}</title>
<style>
  :root{color-scheme:dark;--bg:#090b10;--panel:#11151d;--panel2:#171c26;--line:#293142;--text:#f4f7fb;--muted:#9aa6b8;--accent:#ff6247;--green:#4fd59a;--yellow:#f6c85f;--red:#ff7181;--blue:#69a8ff;--purple:#b493ff}
  *{box-sizing:border-box} body{margin:0;background:radial-gradient(circle at 10% 0,#17203a 0,transparent 32rem),var(--bg);color:var(--text);font:14px/1.55 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
  a{color:#8dbbff}.wrap{width:min(1500px,calc(100% - 32px));margin:auto}.hero{padding:64px 0 30px}.eyebrow{color:var(--accent);font-weight:800;letter-spacing:.16em;text-transform:uppercase}.hero h1{max-width:1050px;margin:.35rem 0 .6rem;font-size:clamp(2rem,5vw,4.5rem);line-height:.96;letter-spacing:-.05em}.lede{max-width:920px;color:var(--muted);font-size:1.05rem}.warning{border:1px solid #754d24;background:#241a0f;color:#ffd894;border-radius:14px;padding:14px 16px;margin-top:20px}.heads{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:24px 0}.head-card,.summary-card,.blockers,.toolbar,.record{border:1px solid var(--line);background:rgba(17,21,29,.92);border-radius:16px}.head-card{padding:16px}.head-card span{display:block;color:var(--muted);font-size:12px}.head-card strong{display:block;margin:5px 0}.mono,.record-id,.ref{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.summary-card{padding:18px}.summary-card h2{margin:0 0 10px;font-size:14px}.counts{display:flex;flex-wrap:wrap;gap:7px}.count{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--line);background:#0c1017;color:var(--text);border-radius:999px;padding:5px 8px;cursor:pointer}.count:hover{border-color:#65718a}.badge{display:inline-flex;align-items:center;border-radius:999px;padding:2px 7px;font-size:11px;font-weight:800;white-space:nowrap}.s-reflected{background:#17382c;color:#86edbd}.s-different,.s-partial{background:#3c3116;color:#ffd979}.s-contradicts,.s-not_reflected{background:#421f28;color:#ff9cac}.s-not_in_spec{background:#272951;color:#bfc3ff}.s-out_of_scope,.s-not_applicable{background:#242b36;color:#b7c0cf}.s-intentionally_not_implemented{background:#2b2142;color:#d5b9ff}.s-accepted{background:#17382c;color:#86edbd}.s-refuted{background:#421f28;color:#ff9cac}.s-missed{background:#3c3116;color:#ffd979}
  .blockers{margin:12px 0 24px;padding:18px}.blockers h2{margin:0}.blockers p{color:var(--muted)}.blockers ul{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;padding:0;list-style:none}.blockers li{display:flex;flex-direction:column;border:1px solid #5b2d39;background:#221319;border-radius:10px;padding:12px}.blockers li span{color:#d9aeb7;font-size:12px;margin-top:4px}.toolbar{position:sticky;top:8px;z-index:10;display:flex;flex-wrap:wrap;gap:10px;padding:12px;margin-bottom:15px;box-shadow:0 10px 30px #0008}.toolbar input,.toolbar select{min-height:42px;border:1px solid var(--line);background:#090c12;color:var(--text);border-radius:10px;padding:0 12px}.toolbar input{flex:1;min-width:230px}.toolbar span{align-self:center;color:var(--muted)}.record-list{display:grid;gap:12px;padding-bottom:80px}.record{padding:18px;scroll-margin-top:90px}.record-head{display:flex;justify-content:space-between;gap:12px}.record-id{font-weight:900;color:#d7e3ff}.meta{color:var(--muted);font-size:12px;margin-left:9px}.area{color:#c5d5ed;font-size:12px}.record blockquote{margin:14px 0;padding:13px 15px;border-left:3px solid var(--accent);background:#0b0f16;border-radius:0 10px 10px 0;white-space:pre-wrap}.triage{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.triage section{min-width:0;border:1px solid var(--line);background:var(--panel2);border-radius:11px;padding:13px}.triage h3{display:flex;align-items:center;justify-content:space-between;gap:7px;margin:0 0 8px;font-size:13px}.triage p{margin:.4rem 0}.ref{color:var(--muted);font-size:11px;overflow-wrap:anywhere}.shots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:10px}.shot{display:block;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:#090c12;text-decoration:none}.shot img{display:block;width:100%;height:88px;object-fit:cover;object-position:top}.shot span{display:block;padding:5px;color:var(--muted);font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.record details{margin-top:10px;color:var(--muted)}.record summary{cursor:pointer}.record[hidden]{display:none}.footer{color:var(--muted);padding:0 0 60px}
  @media(max-width:900px){.heads,.summary,.triage{grid-template-columns:1fr}.blockers ul{grid-template-columns:1fr}.record-head{flex-direction:column}.toolbar{top:0}.hero{padding-top:38px}.shot img{height:120px}}
</style>
</head>
<body>
<main class="wrap">
  <section class="hero">
    <div class="eyebrow">112-record compliance audit</div>
    <h1>Feedback vs v3.4 and the latest open frontend/backend PRs</h1>
    <p class="lede">Every exported comment and vote-note is classified against the confirmed v3.4 specification, then checked at immutable frontend and backend PR heads. Frontend gaps include route-level desktop/mobile screenshot proof.</p>
    <div class="warning"><strong>Open-PR caveat.</strong> “Reflected” means present at the inspected head. It does not mean merged or deployed to production.</div>
    <div class="heads">
      <div class="head-card"><span>Specification</span><strong>UI-Doc v3.4 · CONFIRMED</strong><a href="${escapeHTML(heads.specification.url)}">Open source spec</a></div>
      <div class="head-card"><span>Frontend aggregate</span><strong>paideia-ai/axiia-cup PR #97</strong><span class="mono">${heads.frontend.head_sha}</span><a href="${escapeHTML(heads.frontend.url)}">Open PR</a></div>
      <div class="head-card"><span>Backend aggregate</span><strong>paideia-ai/axiia-cup-v2 PR #5</strong><span class="mono">${heads.backend.head_sha}</span><a href="${escapeHTML(heads.backend.url)}">Open PR</a></div>
    </div>
  </section>

  <section class="summary">
    <div class="summary-card"><h2>v3.4 comparison · ${summary.divergent_from_v34} divergent</h2><div class="counts">${countPills(summary.spec)}</div></div>
    <div class="summary-card"><h2>Frontend · ${summary.frontend_gaps} partial/gap records</h2><div class="counts">${countPills(summary.frontend)}</div></div>
    <div class="summary-card"><h2>Backend at open PR #5</h2><div class="counts">${countPills(summary.backend)}</div></div>
  </section>

  <section class="blockers">
    <h2>Backend PR #5 review blockers</h2>
    <p>GitHub CI is green, but the current exact head has four unresolved adversarial-review blockers. These materially limit any “implemented” claim.</p>
    <ul>${blockers}</ul>
  </section>

  <section class="toolbar" aria-label="Audit filters">
    <input id="search" type="search" placeholder="Search ID, author, area, comment, rationale…">
    <select id="specFilter" aria-label="Filter by v3.4 status"><option value="all">All v3.4 statuses</option>${Object.keys(summary.spec).map((status) => `<option value="${status}">${escapeHTML(label[status])}</option>`).join('')}</select>
    <select id="frontFilter" aria-label="Filter by frontend status"><option value="all">All frontend statuses</option>${Object.keys(summary.frontend).map((status) => `<option value="${status}">${escapeHTML(label[status])}</option>`).join('')}</select>
    <select id="backFilter" aria-label="Filter by backend status"><option value="all">All backend statuses</option>${Object.keys(summary.backend).map((status) => `<option value="${status}">${escapeHTML(label[status])}</option>`).join('')}</select>
    <span id="shown">112 shown</span>
    <a href="feedback-compliance.json">JSON</a>
  </section>

  <section id="records" class="record-list">${cards}</section>
  <p class="footer">Generated ${escapeHTML(report.generated_at)} · deterministic fixture screenshots · exact open-PR heads preserved in JSON.</p>
</main>
<script>
  const records=[...document.querySelectorAll('.record')]
  const search=document.querySelector('#search')
  const spec=document.querySelector('#specFilter')
  const front=document.querySelector('#frontFilter')
  const back=document.querySelector('#backFilter')
  const shown=document.querySelector('#shown')
  function apply(){
    const q=search.value.trim().toLowerCase()
    let count=0
    for(const card of records){
      const ok=(!q||card.dataset.search.includes(q))&&(spec.value==='all'||card.dataset.spec===spec.value)&&(front.value==='all'||card.dataset.front===front.value)&&(back.value==='all'||card.dataset.back===back.value)
      card.hidden=!ok
      if(ok)count++
    }
    shown.textContent=count+' shown'
  }
  search.addEventListener('input',apply)
  for(const select of [spec,front,back])select.addEventListener('change',apply)
  for(const button of document.querySelectorAll('.count'))button.addEventListener('click',()=>{
    const value=button.dataset.filter
    if([...spec.options].some(o=>o.value===value))spec.value=value
    else if([...front.options].some(o=>o.value===value))front.value=value
    apply()
    document.querySelector('.toolbar').scrollIntoView({behavior:'smooth'})
  })
</script>
</body>
</html>`

await writeFile(htmlPath, html)
await writeFile(auditHtmlPath, html)
await writeFile(indexPath, html)

console.log(JSON.stringify({ jsonPath, htmlPath, records: records.length, summary }, null, 2))
