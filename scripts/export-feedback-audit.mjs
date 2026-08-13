#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..')
const uiuxRoot = process.env.AXIIA_UIUX_ROOT || '/home/ubuntu/axiia-cup-uiux'
const mockRoot = process.env.AXIIA_MOCK_ROOT || '/home/ubuntu/axiia-cup-v3mock/v3-mock'
const outputDir = path.join(repoRoot, 'docs', 'analysis', 'feedback-audit')
const jsonPath = path.join(outputDir, 'feedback-audit.json')
const htmlPath = path.join(outputDir, 'feedback-audit.html')

const GENERATED_AT = new Date().toISOString()
const AUDIT_DATE = GENERATED_AT.slice(0, 10)
const DEPLOY_BASE = 'https://deploy-v2-ebon-beta.vercel.app'

const sourceConfigPath = path.join(uiuxRoot, 'UI-Doc-v3.2.html')
const sourceConfig = await readFile(sourceConfigPath, 'utf8')
const supabaseUrl = sourceConfig.match(/^var SB_URL="([^"]+)";/m)?.[1]
const supabaseAnon = sourceConfig.match(/^var SB_ANON="([^"]+)";/m)?.[1]

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(`Could not read the public Supabase configuration from ${sourceConfigPath}`)
}

const headers = {
  apikey: supabaseAnon,
  Authorization: `Bearer ${supabaseAnon}`,
}

async function getTable(pathname) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${pathname}`, { headers })
  if (!response.ok) {
    throw new Error(`Supabase request failed (${response.status}): ${await response.text()}`)
  }
  return response.json()
}

const [comments, allPicks] = await Promise.all([
  getTable('comments?select=id,card_id,parent_id,author,body,created_at&order=created_at.asc'),
  getTable('picks?select=id,card_id,author,choice,note,updated_at&order=updated_at.asc'),
])

const writtenNotes = allPicks.filter((pick) => String(pick.note ?? '').trim().length > 0)

const EVIDENCE = {
  spec: {
    label: 'Current UI specification v3.4',
    local_path: path.join(uiuxRoot, 'UI-Doc-v3.4.md'),
    web_url: `${DEPLOY_BASE}/v3-4`,
  },
  workItems: {
    label: 'v3.3/v3.4 work-item register',
    local_path: path.join(uiuxRoot, 'v3.3-work-items.md'),
    web_url: `${DEPLOY_BASE}/v3-3-issues`,
  },
  rollout: {
    label: 'Current dev rollout RFC and implementation status',
    local_path: path.join(uiuxRoot, 'rfc', 'dev-rollout-rfc.md'),
    web_url: `${DEPLOY_BASE}/dev-rfc`,
  },
  agentEdit: {
    label: 'Agent-edit meeting conclusion',
    local_path: path.join(uiuxRoot, 'deploy-v2', 'agent-edit-conclusion.html'),
    web_url: `${DEPLOY_BASE}/agent-edit-conclusion`,
  },
  debugAudit: {
    label: 'Debug-mode gap audit and decisions',
    local_path: path.join(uiuxRoot, 'rfc', 'debug-mode-gap-audit.md'),
    web_url: `${DEPLOY_BASE}/debug-mode-align`,
  },
  osLog: {
    label: 'Opponent-selection and debug decision log',
    local_path: path.join(uiuxRoot, 'rfc', 'os-decisions-log.md'),
    web_url: `${DEPLOY_BASE}/v3-4`,
  },
  reviewPlan: {
    label: 'Mock full-site review plan',
    local_path: path.join(uiuxRoot, 'deploy-v2', 'mock-review-plan.html'),
    web_url: `${DEPLOY_BASE}/mock-review-plan`,
  },
  agentLogic: {
    label: 'Agent-edit logic decision board',
    local_path: path.join(uiuxRoot, 'deploy-v2', 'agent-edit-logic.html'),
    web_url: `${DEPLOY_BASE}/agent-edit-logic`,
  },
  p1Code: {
    label: 'Merged P1 information-architecture implementation',
    local_path: path.join(repoRoot, 'v2', 'web', 'src'),
    web_url: `${DEPLOY_BASE}/pr-94-review`,
  },
  p2Code: {
    label: 'Merged P2 agent/PVP-gate frontend implementation',
    local_path: path.join(repoRoot, 'v2', 'web', 'src'),
    web_url: `${DEPLOY_BASE}/pr-96-review`,
  },
  replayCode: {
    label: 'Merged replay and judge-tendency implementation',
    local_path: path.join(repoRoot, 'v2', 'web', 'src'),
    web_url: `${DEPLOY_BASE}/pr-97-review`,
  },
  mockCode: {
    label: 'Current v3.4 interactive mock',
    local_path: path.join(mockRoot, 'src'),
    web_url: 'https://axiia-v3-mock.vercel.app',
  },
}

function evidence(keys, summary) {
  return keys.map((key) => ({ ...EVIDENCE[key], summary }))
}

const PROGRESS_LABELS = {
  implemented: 'Implemented / merged',
  completed: 'Decision or artifact complete',
  specified: 'Accepted in current specification',
  planned: 'Accepted and scheduled',
  partial: 'Partially dealt with',
  deferred: 'Explicitly deferred',
  superseded: 'Dealt with, later superseded',
  rejected: 'Rejected or overturned',
  unaddressed: 'No handling evidence found',
  not_applicable: 'Non-actionable / intentionally ignored',
}

function assessment(disposition, state, detail, evidenceKeys = [], options = {}) {
  return {
    disposition,
    confidence: options.confidence ?? 'high',
    rationale: detail,
    progress: {
      state,
      label: PROGRESS_LABELS[state],
      last_reviewed: AUDIT_DATE,
      decision_date: options.decisionDate ?? null,
      detail: options.progressDetail ?? detail,
    },
    evidence: evidence(evidenceKeys, options.evidenceSummary ?? detail),
    components: options.components ?? [],
  }
}

const accepted = (detail, evidenceKeys, options = {}) =>
  assessment('accepted', options.state ?? 'specified', detail, evidenceKeys, options)
const refuted = (detail, evidenceKeys, options = {}) =>
  assessment('refuted', options.state ?? 'rejected', detail, evidenceKeys, options)
const missed = (detail, evidenceKeys = [], options = {}) =>
  assessment('missed', options.state ?? 'unaddressed', detail, evidenceKeys, options)

const PAGE_DEFS = {
  decisions: {
    id: 'decisions',
    label: 'UI v2 decisions board',
    local_path: path.join(uiuxRoot, 'UI-Doc-v2-decisions.html'),
    web_url: `${DEPLOY_BASE}/decisions`,
  },
  v3plan: {
    id: 'v3plan',
    label: 'UI v3 plan and confirmation board',
    local_path: path.join(uiuxRoot, 'UI-Doc-v3-plan.html'),
    web_url: `${DEPLOY_BASE}/v3plan`,
  },
  v3: {
    id: 'v3',
    label: 'UI v3 specification comments',
    local_path: path.join(uiuxRoot, 'UI-Doc-v3.2.html'),
    web_url: `${DEPLOY_BASE}/v3-2`,
  },
  v33: {
    id: 'v33',
    label: 'UI v3.3 change review',
    local_path: path.join(uiuxRoot, 'deploy-v2', 'v3-3.html'),
    web_url: `${DEPLOY_BASE}/v3-3`,
  },
  mockReview: {
    id: 'mock-review',
    label: 'Mock full-site review',
    local_path: path.join(uiuxRoot, 'deploy-v2', 'mock-review-plan.html'),
    web_url: `${DEPLOY_BASE}/mock-review-plan`,
  },
  agentEdit: {
    id: 'agent-edit',
    label: 'Agent-edit logic review',
    local_path: path.join(uiuxRoot, 'deploy-v2', 'agent-edit-logic.html'),
    web_url: `${DEPLOY_BASE}/agent-edit-logic`,
  },
  debug: {
    id: 'debug',
    label: 'Debug-mode alignment review',
    local_path: path.join(uiuxRoot, 'deploy-v2', 'debug-mode-align.html'),
    web_url: `${DEPLOY_BASE}/debug-mode-align`,
  },
  timeline: {
    id: 'timeline',
    label: 'Sprint timeline',
    local_path: path.join(uiuxRoot, 'deploy-v2', 'timeline.html'),
    web_url: `${DEPLOY_BASE}/timeline`,
  },
}

const meta = (title, area, page, section = null) => ({ title, area, page, section })

const CARD_META = {
  'agent-model': meta('Agent identity: one agent or many?', 'Agent architecture', 'decisions'),
  'rankings-home': meta('Where the PVP ladder lives', 'Rankings & tournaments', 'decisions'),
  'rating-model': meta('Rating ownership, scope, and seeding', 'Rankings & tournaments', 'decisions'),
  'subpage-concept': meta('Sub-page and focus-mode vocabulary', 'Navigation & information architecture', 'decisions'),
  'flow-semantics': meta('Function/page map and global navigation', 'Navigation & information architecture', 'decisions'),
  'public-depth': meta('Public depth and showcase battles', 'Landing & public sharing', 'decisions'),
  'first-run-express': meta('First-battle express lane', 'Registration & onboarding', 'decisions'),
  registration: meta('Registration gate and automatic login', 'Registration & onboarding', 'decisions'),
  'scenario-card': meta('Scenario-card routing and statistics', 'Scenario discovery', 'decisions'),
  'e-chat': meta('Builder chat / one-shot generation', 'Prompt builder', 'decisions'),
  'e-deck': meta('Deck/card authoring mode', 'Prompt builder', 'decisions'),
  'ea-stats-diff': meta('Per-version W/L and prompt diff', 'Agents & version management', 'decisions'),
  'pvp-gate': meta('PVE-before-PVP gate', 'Opponent selection & PVP', 'decisions'),
  'pvp-backend': meta('Player-initiated PVP backend', 'Opponent selection & PVP', 'decisions'),
  'battle-launch': meta('How a battle launches', 'Battle queue & live view', 'decisions'),
  'inner-monologue': meta('Agent and judge inner monologue', 'Battle report & replay', 'decisions'),
  'share-exposure': meta('Shared battle-report visibility', 'Battle report & replay', 'decisions'),
  'round-timeline': meta('Tournament round timeline', 'Rankings & tournaments', 'decisions'),
  'notif-kinds': meta('Notification types', 'Notifications & settings', 'decisions'),
  'defer-pvp-rating': meta('Alpha scope for PVP and rating', 'Opponent selection & PVP', 'v3plan'),
  'doc-structure': meta('Formal v3 specification structure', 'Documentation & design process', 'v3plan'),
  'fork-agent-model': meta('Per-side vs both-sides agent model', 'Agent architecture', 'v3plan'),
  'fork-e-chat': meta('Card-first builder vs multi-turn chat', 'Prompt builder', 'v3plan'),
  'fork-wenan-view': meta('Narrative vs raw-rules view', 'Scenario details', 'v3plan'),
  'clarify-inner-os': meta('Definition of inner OS', 'Battle report & replay', 'v3plan'),
  'clarify-score-process': meta('Score derivation and trust boundary', 'Battle report & replay', 'v3plan'),
  'clarify-empty-states': meta('Guided empty-state pattern', 'Navigation & information architecture', 'v3plan'),
  'visual-os-placement': meta('Five-way opponent-selection sketch', 'Documentation & design process', 'v3plan'),
  'visual-optional': meta('Optional supporting diagrams', 'Documentation & design process', 'v3plan'),
  'gap-onboarding': meta('Express lane during tournaments', 'Registration & onboarding', 'v3plan'),
  'gap-cost-integrity': meta('PVE cost cap and prompt injection', 'Safety, cost & integrity', 'v3plan'),
  'gap-verdict-trust': meta('Displayed rules and model confounding', 'Battle report & replay', 'v3plan'),
  'gap-share-safety': meta('Public-match redaction and mobile sharing', 'Landing & public sharing', 'v3plan'),
  'converged-bulk': meta('Confirmation of converged decisions', 'Documentation & design process', 'v3plan'),
  'tl:n-smoketest': meta('Deployment smoke-test sentinel', 'Operations & testing', 'timeline'),

  'v3:s0-agents': meta('Agent definition and side model', 'Agent architecture', 'v3'),
  'v3:rm-what': meta('v3 change-log test card', 'Documentation & design process', 'v3'),
  'v3:s1-map': meta('Page/function map and OS routing', 'Navigation & information architecture', 'v3'),
  'v3:pg-a': meta('Page A: public landing', 'Landing & public sharing', 'v3'),
  'v3:pg-bc': meta('Pages B/C: login and registration', 'Registration & onboarding', 'v3'),
  'v3:pg-d': meta('Page D: scenario discovery', 'Scenario discovery', 'v3'),
  'v3:pg-fa': meta('Page FA: battle report and replay', 'Battle report & replay', 'v3'),
  'v3:pg-i': meta('Page I: notifications', 'Notifications & settings', 'v3'),
  'v3:s3-gate': meta('PVE-to-PVP gate definition', 'Opponent selection & PVP', 'v3'),
  'v3:s5-agent-model': meta('Agent identity decision', 'Agent architecture', 'v3'),
  'v3:s5-rating': meta('Manual vs automatic-match rating', 'Rankings & tournaments', 'v3'),
  'v3:s5-focus': meta('Focus mode and notification decisions', 'Navigation & information architecture', 'v3'),
  'v3:s5-provisional': meta('Opponent-selection layout option', 'Opponent selection & PVP', 'v3'),
  'v3:s5-gaps': meta('Remaining gate and visibility gaps', 'Opponent selection & PVP', 'v3'),
  'v3:c33-chg-v33': meta('v3.3 change: judge OS trace', 'Battle report & replay', 'v33'),

  'aed:d2': meta('D2: Basic/Meta baseline switching to MCQ', 'Prompt builder', 'agentEdit'),
  'aed:d4': meta('D4: mode after editing MCQ-generated text', 'Prompt builder', 'agentEdit'),
  'aed:d7': meta('D7: whether meta prompt includes the current draft', 'Prompt builder', 'agentEdit'),
  'dbg:b5': meta('B5: old-match inner-OS empty state', 'Battle report & replay', 'debug'),
}

const MRP_META = {
  s3: meta('S3 · Registration → first-battle express lane', 'Registration & onboarding', 'mockReview', 'S3'),
  s4: meta('S4 · Scenario selection (D)', 'Scenario discovery', 'mockReview', 'S4'),
  s5: meta('S5 · Scenario details (DA)', 'Scenario details', 'mockReview', 'S5'),
  s6: meta('S6 · Prompt builder (E)', 'Prompt builder', 'mockReview', 'S6'),
  s7: meta('S7 · Opponent-selection dispatch panel', 'Opponent selection & PVP', 'mockReview', 'S7'),
  s8: meta('S8 · Ongoing-battle strip and live view', 'Battle queue & live view', 'mockReview', 'S8'),
  s9: meta('S9 · Finished battle report (FA)', 'Battle report & replay', 'mockReview', 'S9'),
  s10: meta('S10 · Agent view (EA)', 'Agents & version management', 'mockReview', 'S10'),
  s11: meta('S11 · My agents (MA)', 'Agents & version management', 'mockReview', 'S11'),
  s12: meta('S12 · History / ranking / notifications / settings', 'Rankings, history & settings', 'mockReview', 'S12'),
  s13: meta('S13 · Mobile review', 'Mobile & responsive UI', 'mockReview', 'S13'),
}

function cardMeta(cardId) {
  if (CARD_META[cardId]) return CARD_META[cardId]
  if (cardId.startsWith('mrp:')) return MRP_META[cardId.slice(4)]
  throw new Error(`No card metadata for ${cardId}`)
}

function topicFor(text) {
  const value = text.toLowerCase()
  if (/aria|读屏|键盘|可访问|accessib|role=|tabindex|对比度/.test(value)) return 'Accessibility'
  if (/手机|移动端|390|430px|44px|触控|横向滚动|布局/.test(value)) return 'Responsive design'
  if (/虚构|假数据|真实|同一个.*链接|数据|泄露|安全|成本|注入/.test(value)) return 'Data integrity / safety'
  if (/不理解|解释|误导|文案|clarif|提示|定义/.test(value)) return 'Clarity and copy'
  if (/implement|minsheng|vivian or|keso|负责人|assign/.test(value)) return 'Ownership / implementation'
  if (/test|smoke|debug|review/.test(value)) return 'Testing and diagnostics'
  return 'Product decision / behavior'
}

const COMMENT_RULES = new Map()
const setComments = (ids, value) => ids.forEach((id) => COMMENT_RULES.set(id, value))

setComments([1, 7, 16], refuted(
  'The both-sides agent model was explicitly overturned on 2026-08-05; v3.4 uses one single-side agent per side.',
  ['spec'],
  { state: 'superseded', decisionDate: '2026-08-05' },
))
setComments([3], accepted(
  'The request to reconfirm the agent model was acted on; the decision was later revisited again and finalized as per-side.',
  ['spec'],
  { state: 'superseded', decisionDate: '2026-08-05' },
))
setComments([4], missed(
  'This was a test comment rather than actionable feedback, so no product action was expected.',
  [],
  { state: 'not_applicable', confidence: 'high' },
))
setComments([6], accepted(
  'The alternative was recorded in v3.2; the later per-side architecture resolved the underlying one-sided-management concern more directly.',
  ['spec'],
  { state: 'superseded', decisionDate: '2026-08-05' },
))
setComments([8, 9, 10], accepted(
  'The OS label, global navigation, and E → OS routing were incorporated into the current information architecture.',
  ['spec', 'p1Code'],
  { state: 'implemented', decisionDate: '2026-07-31' },
))
setComments([11], accepted(
  'The public landing work was explicitly assigned and is scheduled in rollout phase P5.',
  ['spec', 'rollout'],
  { state: 'planned', decisionDate: '2026-07-31' },
))
setComments([12], accepted(
  'A scenario-selection design sample and interactive mock now exist.',
  ['reviewPlan', 'mockCode'],
  { state: 'completed', decisionDate: '2026-08-07' },
))
setComments([13], accepted(
  'Login/registration ownership was recorded, and the work is part of the rollout plan.',
  ['spec', 'rollout'],
  { state: 'planned', decisionDate: '2026-07-31' },
))
setComments([14], accepted(
  'Replay is specified as a client-side re-enactment with no new LLM calls and has been implemented in the replay work.',
  ['spec', 'replayCode'],
  { state: 'implemented', decisionDate: '2026-08-11' },
))
setComments([15], accepted(
  'All notification types were subsequently defined as an eight-kind list; full delivery is scheduled in P3.',
  ['spec', 'rollout'],
  { state: 'planned', decisionDate: '2026-08-04' },
))
setComments([17], accepted(
  'The concern was accepted: v3.4 moved to independently managed single-side agents and added explicit two-side completion guidance.',
  ['spec', 'p2Code'],
  { state: 'implemented', decisionDate: '2026-08-05' },
))
setComments([18], accepted(
  'Manual friendlies are unranked and automatic matchmaking is the rated path; the rating algorithm remains a W11 design item.',
  ['spec', 'workItems'],
  { state: 'partial', decisionDate: '2026-08-04' },
))
setComments([19], accepted(
  'Focus mode was explicitly deferred while notification definitions were pulled forward and completed.',
  ['spec', 'workItems'],
  { state: 'partial', decisionDate: '2026-08-04' },
))
setComments([20], accepted(
  'Option (e), compact asynchronous dispatch from an agent, is the current OS design.',
  ['spec', 'p1Code'],
  { state: 'implemented', decisionDate: '2026-07-24' },
))
setComments([21, 22], accepted(
  'The PVP gate is per scenario and per side, with distinct defeated opponents counted within each side.',
  ['spec', 'p2Code'],
  { state: 'implemented', decisionDate: '2026-08-05' },
))
setComments([23], accepted(
  'Both generated judge OS and judge trace are public; only the player-owned side trace remains owner-only.',
  ['spec', 'p1Code'],
  { state: 'implemented', decisionDate: '2026-08-04' },
))
setComments([24, 25], accepted(
  'The v3.3 judge-OS change was revised exactly as requested: generated OS and real thinking trace coexist, with trace visible through debug mode.',
  ['spec', 'p1Code'],
  { state: 'implemented', decisionDate: '2026-08-11' },
))

setComments([26, 27, 31, 50, 51], missed(
  'The mobile layout issue was acknowledged and explicitly postponed for a later consolidated mobile review; no completed fix was found for this specific report.',
  ['reviewPlan'],
  { state: 'deferred', confidence: 'high', decisionDate: '2026-08-10' },
))
setComments([28], missed(
  'The scenario card still relies on click handling without evidence that the requested link/button keyboard semantics were added.',
  ['mockCode'],
  { confidence: 'high' },
))
setComments([29], missed(
  'No evidence was found that the OS mobile touch targets and first-level mode hierarchy were revised as requested.',
  ['mockCode'],
  { confidence: 'medium' },
))
setComments([30], missed(
  'Result-first ordering and replay were implemented, but the requested section index, default folding, and actionable improvement summary were not found.',
  ['spec', 'replayCode'],
  {
    state: 'partial',
    confidence: 'high',
    components: [
      { claim: 'Put the result first', disposition: 'accepted' },
      { claim: 'Add section navigation/folding and improvement summary', disposition: 'missed' },
    ],
  },
))
setComments([32], missed(
  'No evidence was found that the builder select, mode tabs, and MCQ choices received the requested accessible labels and selected-state semantics.',
  ['mockCode'],
))
setComments([33], missed(
  'No evidence was found that repeated EA version controls received version-specific accessible names.',
  ['mockCode'],
))
setComments([34], missed(
  'No evidence was found that My Agents quick actions received agent-specific accessible names.',
  ['mockCode'],
))
setComments([35], missed(
  'The settings switches still lack the requested switch role, checked state, and accessible labels in the reviewed mock.',
  ['mockCode'],
))
setComments([36], missed(
  'The intended latest-version/default-selection behavior is not recorded as a resolved decision in the current spec or agent-edit conclusion.',
  ['spec', 'agentEdit'],
  { confidence: 'medium' },
))
setComments([37, 38, 39], accepted(
  'The visibility model was reduced to exactly three restricted items, and debug mode is surfaced in the battle-report header.',
  ['spec', 'p1Code'],
  { state: 'implemented', decisionDate: '2026-08-10' },
))
setComments([40, 41, 42, 56], accepted(
  'The scenario-card PVP gate display was corrected to per-side progress with the current configurable threshold.',
  ['spec', 'p2Code'],
  { state: 'implemented', decisionDate: '2026-08-11' },
))
setComments([43, 52, 53, 57], accepted(
  'The question triggered a product clarification: every PVE-NPC/agent is single-side, and changing sides means selecting an agent on the other side.',
  ['spec', 'p2Code'],
  { state: 'implemented', decisionDate: '2026-08-10' },
))
setComments([44, 58], accepted(
  'The opposite-side creation gate and its explanatory copy were specified and implemented in the mock and P2 flow.',
  ['spec', 'p2Code', 'mockCode'],
  { state: 'implemented', decisionDate: '2026-08-11' },
))
setComments([45], missed(
  'The question was identified as scenario/prompt content rather than a UI-architecture defect, but no content revision or tracked work item was found.',
  ['reviewPlan'],
  { confidence: 'medium' },
))
setComments([46, 54], accepted(
  'Debug mode received a dedicated audit, five decisions, aligned copy, and implementation work.',
  ['debugAudit', 'spec', 'p1Code'],
  { state: 'implemented', decisionDate: '2026-08-11' },
))
setComments([47], missed(
  'The current spec says unfinished ranking controls should be hidden, but no evidence was found that the reviewed mock replaced its fictional standings with an honest empty state.',
  ['spec', 'mockCode'],
  { confidence: 'high' },
))
setComments([48], missed(
  'No evidence was found that the three distinct history rows stopped pointing at the same demo report.',
  ['mockCode'],
  { confidence: 'high' },
))
setComments([49], refuted(
  'The “missing debug switch in Settings” claim was explicitly corrected: debug belongs in the battle-report header. The accessibility half remains unresolved.',
  ['debugAudit', 'mockCode'],
  {
    state: 'partial',
    components: [
      { claim: 'Add debug switch to Settings', disposition: 'refuted' },
      { claim: 'Add accessible names to the two switches', disposition: 'missed' },
    ],
  },
))
setComments([55], accepted(
  'The issue was triaged as scenario prompt/content rather than battle-report UI behavior; no UI change was pursued.',
  ['reviewPlan'],
  { state: 'completed', decisionDate: '2026-08-10' },
))
setComments([59], accepted(
  'The list of pages that host the ongoing-battle strip was confirmed and encoded as a route allowlist.',
  ['spec', 'rollout', 'mockCode'],
  { state: 'implemented', decisionDate: '2026-08-10' },
))
setComments([60], refuted(
  'The final #75 decision explicitly keeps a prominent whole-agent “Edit latest” action alongside per-version edit actions.',
  ['spec', 'p1Code'],
  { decisionDate: '2026-08-07' },
))
setComments([61], accepted(
  'The team explicitly deferred mobile cleanup to a later consolidated review.',
  ['reviewPlan'],
  { state: 'deferred', decisionDate: '2026-08-10' },
))
setComments([62], accepted(
  'The team chose not to add the old-match seed state to the mock; real-history handling remains documented for implementation.',
  ['debugAudit', 'osLog'],
  { state: 'deferred', decisionDate: '2026-08-10' },
))
setComments([63, 64, 65], accepted(
  'The agent-edit meeting adopted text as the source of truth: MCQ initializes text, manual edits switch to text mode, and MCQ is not an iteration path.',
  ['agentEdit'],
  { state: 'completed', decisionDate: '2026-08-10' },
))
setComments([66], accepted(
  'The platform does not automate meta-prompt iteration, but players may manually copy existing text into an external AI workflow.',
  ['agentEdit'],
  { state: 'completed', decisionDate: '2026-08-10' },
))
setComments([67], accepted(
  'The discoverability concern was accepted; the resulting decision uses a persistent explanation near the debug layer rather than only an invisible mobile tooltip.',
  ['debugAudit', 'mockCode'],
  { state: 'partial', decisionDate: '2026-08-10' },
))

const NOTE_RULES = new Map()
const noteKey = (cardId, author) => `${cardId}|${author}`
const setNote = (cardId, author, value) => NOTE_RULES.set(noteKey(cardId, author), value)

setNote('agent-model', 'yihan', refuted(
  'The “one agent good” / both-sides choice was later overturned by the final per-side architecture.',
  ['spec'], { state: 'superseded', decisionDate: '2026-08-05' },
))
setNote('agent-model', 'Vivian', refuted(
  'The both-sides choice was later overturned; versions remain, but each agent now belongs to only one side.',
  ['spec'], { state: 'superseded', decisionDate: '2026-08-05' },
))
setNote('rankings-home', 'yihan2', accepted(
  'The current design uses one G ranking hub with tournament and PVP-ladder tabs.',
  ['spec'], { state: 'specified', decisionDate: '2026-08-05' },
))
setNote('rankings-home', 'Vivian', accepted(
  'Tournament standing and the PVP ladder remain conceptually separate tabs; the unfinished ladder may stay hidden until W11 lands.',
  ['spec', 'workItems'], { state: 'partial', decisionDate: '2026-08-05' },
))
setNote('rating-model', 'yihan2', accepted(
  'The accepted constraints match this note: rating starts empty/zero, is per player × scenario, is not seeded from PVE, and awaits a complete design.',
  ['spec', 'workItems'], { state: 'specified', decisionDate: '2026-08-05' },
))
setNote('rating-model', 'Vivian', accepted(
  'The gate was separated from rating, while player × scenario rating and neutral starts became binding W11 constraints.',
  ['spec', 'workItems'], { state: 'specified', decisionDate: '2026-08-05' },
))
setNote('subpage-concept', 'yihan2', accepted(
  'Sub-page vocabulary was adopted; focus mode was kept as a future feature pending further design.',
  ['spec'], { state: 'partial', decisionDate: '2026-08-05' },
))
setNote('e-chat', 'yihan2', refuted(
  'The one-shot in-product generation choice did not survive; the current spec provides a prompt-builder prompt for use in the player’s own AI and no chat.',
  ['spec'], { decisionDate: '2026-08-05' },
))
setNote('e-chat', 'Vivian', refuted(
  'Real multi-turn chat was explicitly excluded; the builder uses MCQ, Basic, and an external prompt-builder prompt.',
  ['spec'], { decisionDate: '2026-08-05' },
))
setNote('flow-semantics', 'Vivian', accepted(
  'Global navigation and corrected function/page semantics were incorporated.',
  ['spec', 'p1Code'], { state: 'implemented', decisionDate: '2026-08-11' },
))
setNote('public-depth', 'Vivian', accepted(
  'The strongest part of the proposal—public showcase battles—was accepted; fully public DA remains incomplete.',
  ['spec', 'rollout'], { state: 'partial', decisionDate: '2026-08-05' },
))
setNote('first-run-express', 'Vivian', accepted(
  'The express lane became a defined alpha flow; full implementation is scheduled in P5.',
  ['spec', 'rollout'], { state: 'planned', decisionDate: '2026-08-05' },
))
setNote('registration', 'Vivian', accepted(
  'Invite-code alpha registration is retained, with automatic login into the express flow.',
  ['spec', 'rollout'], { state: 'planned', decisionDate: '2026-08-05' },
))
setNote('scenario-card', 'Vivian', accepted(
  'Scenario cards route to DA and include estimated match length before building.',
  ['spec', 'mockCode'], { state: 'implemented', decisionDate: '2026-08-05' },
))
setNote('e-deck', 'Vivian', refuted(
  'The one-scenario deck pilot was not adopted: text MCQ is required across scenarios, while visual deck construction is deferred.',
  ['spec'], { decisionDate: '2026-08-05' },
))
setNote('ea-stats-diff', 'Vivian', accepted(
  'Per-version W/L and diff were accepted as core owner-view iteration feedback.',
  ['spec', 'rollout'], { state: 'planned', decisionDate: '2026-08-05' },
))
setNote('pvp-gate', 'Vivian', accepted(
  'A visible progress gate was adopted, later refined to a per-side threshold.',
  ['spec', 'p2Code'], { state: 'implemented', decisionDate: '2026-08-11' },
))
setNote('pvp-backend', 'Vivian', accepted(
  'Manual friendlies are unranked; rated play is reserved for automatic matchmaking, whose design remains pending.',
  ['spec', 'rollout'], { state: 'partial', decisionDate: '2026-08-05' },
))
setNote('battle-launch', 'Vivian', accepted(
  'Asynchronous dispatch with an ongoing-battle strip was adopted for all post-first-battle runs.',
  ['spec', 'rollout'], { state: 'planned', decisionDate: '2026-08-05' },
))
setNote('inner-monologue', 'Vivian', accepted(
  'The final design keeps a generated judge-OS summary and adds real trace as a separate debug layer.',
  ['spec', 'p1Code'], { state: 'implemented', decisionDate: '2026-08-11' },
))
setNote('share-exposure', 'Vivian', accepted(
  'Prompts and diffs remain owner-only in the final visibility rules.',
  ['spec'], { state: 'specified', decisionDate: '2026-08-05' },
))
setNote('round-timeline', 'Vivian', accepted(
  'The tournament center retains a by-round timeline; full ranking-center work is scheduled for P6.',
  ['spec', 'rollout'], { state: 'planned', decisionDate: '2026-08-05' },
))
setNote('notif-kinds', 'Vivian', accepted(
  'The notification list was expanded and finalized as eight kinds, with PVP/tournament priority.',
  ['spec', 'rollout'], { state: 'planned', decisionDate: '2026-08-04' },
))
setNote('defer-pvp-rating', 'Vivian', accepted(
  'The product keeps unranked manual PVP while deferring the rating algorithm; this matches the substance of the note.',
  ['spec', 'workItems'], { state: 'partial', decisionDate: '2026-08-05' },
))
setNote('doc-structure', 'Vivian', accepted(
  'v3.4 now reads as a formal specification with settled decisions folded into the body.',
  ['spec'], { state: 'completed', decisionDate: '2026-08-05' },
))
setNote('fork-agent-model', 'Vivian', refuted(
  'The selected both-sides option was overturned; the note’s migration warning was retained as planning context, but the final architecture is per-side.',
  ['spec', 'rollout'], { state: 'superseded', decisionDate: '2026-08-05' },
))
setNote('fork-e-chat', 'Vivian', accepted(
  'Chat was deferred and the builder was reduced to bounded authoring modes.',
  ['spec'], { state: 'specified', decisionDate: '2026-08-05' },
))
setNote('fork-wenan-view', 'Vivian', accepted(
  'The narrative ↔ raw-rules toggle is retained in DA.',
  ['spec'], { state: 'specified', decisionDate: '2026-08-05' },
))
setNote('clarify-inner-os', 'Vivian', accepted(
  'Generated summaries were retained, with real trace added as a separate layer rather than replacing them.',
  ['spec', 'p1Code'], { state: 'implemented', decisionDate: '2026-08-11' },
))
setNote('clarify-score-process', 'Vivian', refuted(
  'The phased narrative-first choice was superseded by a final specification that requires system support for structured score derivation.',
  ['spec', 'rollout'], { state: 'superseded', decisionDate: '2026-08-04' },
))
setNote('gap-onboarding', 'Vivian', refuted(
  'The proposed separate fast execution lane was not made an alpha requirement; express implementation is scheduled later in P5.',
  ['spec', 'rollout'], { state: 'deferred', decisionDate: '2026-08-05' },
))
setNote('gap-cost-integrity', 'Vivian', refuted(
  'Cost limiting was accepted, but the requested prompt-injection guard was explicitly rejected as unnecessary for this game.',
  ['spec'], {
    state: 'partial',
    decisionDate: '2026-08-05',
    components: [
      { claim: 'Add PVE cost/rate caps', disposition: 'accepted' },
      { claim: 'Add judge prompt-injection defenses', disposition: 'refuted' },
    ],
  },
))
setNote('gap-verdict-trust', 'Vivian', accepted(
  'Displayed rules were moved to scenario data and both models are public; same-model first-run PVE was not adopted.',
  ['spec'], {
    state: 'partial',
    decisionDate: '2026-08-05',
    components: [
      { claim: 'Displayed rules must match scenario/scorer data', disposition: 'accepted' },
      { claim: 'Show both models', disposition: 'accepted' },
      { claim: 'Force same-model first run', disposition: 'missed' },
    ],
  },
))
setNote('converged-bulk', 'Vivian', accepted(
  'The converged decisions were folded into the v3 specification.',
  ['spec'], { state: 'completed', decisionDate: '2026-08-05' },
))
setNote('gap-share-safety', 'Vivian', refuted(
  'The core redaction claim was rejected: hidden assignments are public game information; mobile readability remains a requirement.',
  ['spec'], {
    state: 'partial',
    decisionDate: '2026-08-05',
    components: [
      { claim: 'Redact hidden assignments from public reports', disposition: 'refuted' },
      { claim: 'Make shared reports mobile-readable', disposition: 'accepted' },
    ],
  },
))
setNote('doc-structure', 'yihan2', refuted(
  'The request to keep J as a separate page was not adopted; the final spec resolves rankings as two tabs inside G.',
  ['spec'], { decisionDate: '2026-08-05' },
))
setNote('fork-e-chat', 'yihan2', accepted(
  'The final builder has MCQ/card authoring plus a prompt-builder prompt for external AI use, with no in-product chat.',
  ['spec'], { state: 'specified', decisionDate: '2026-08-05' },
))
setNote('clarify-inner-os', 'yihan2', accepted(
  'Generated judge OS explicitly retains the judge persona and model.',
  ['spec'], { state: 'implemented', decisionDate: '2026-08-11' },
))
setNote('clarify-score-process', 'yihan2', accepted(
  'The current spec requires structured scoring support, LLM assignment of soft outcomes, and faithful rule display.',
  ['spec', 'rollout'], { state: 'planned', decisionDate: '2026-08-04' },
))
setNote('clarify-empty-states', 'yihan2', accepted(
  'Guided empty states remain in the spec and mock, but are explicitly provisional rather than a closed final design.',
  ['spec', 'mockCode'], { state: 'partial', decisionDate: '2026-08-05' },
))
setNote('visual-os-placement', 'yihan2', accepted(
  'The five-way comparison sketch was built and retained as discussion support, not as the specification itself.',
  ['spec'], { state: 'completed', decisionDate: '2026-07-25' },
))
setNote('visual-optional', 'yihan2', accepted(
  'All four optional supporting diagrams were produced and kept succinct.',
  ['spec'], { state: 'completed', decisionDate: '2026-07-25' },
))
setNote('gap-onboarding', 'yihan2', accepted(
  'The issue was explicitly moved out of the alpha blocker set; express work remains scheduled in P5.',
  ['spec', 'rollout'], { state: 'deferred', decisionDate: '2026-08-05' },
))
setNote('gap-cost-integrity', 'yihan2', accepted(
  'The cost-cap half was accepted while judge prompt injection was deliberately not treated as a problem.',
  ['spec'], { state: 'partial', decisionDate: '2026-08-05' },
))
setNote('gap-verdict-trust', 'yihan2', refuted(
  'The proposal to discard the issue did not fully hold: the final spec still requires non-hardcoded displayed rules and public model information.',
  ['spec'], { state: 'partial', decisionDate: '2026-08-05' },
))
setNote('gap-share-safety', 'yihan2', accepted(
  'The final specification agrees that shared reports need no hidden-assignment masking and that mobile still needs normal support.',
  ['spec'], { state: 'specified', decisionDate: '2026-08-05' },
))
setNote('tl:n-smoketest', 'claude-smoke', missed(
  'This is an explicitly hidden deployment smoke-test sentinel, not product feedback.',
  [], { state: 'not_applicable' },
))

function sourceFor(cardId) {
  const info = cardMeta(cardId)
  return { ...PAGE_DEFS[info.page], card_id: cardId, card_title: info.title, section: info.section }
}

function normalizeComment(comment) {
  const rule = COMMENT_RULES.get(comment.id)
  if (!rule) throw new Error(`No classification rule for comment id ${comment.id}`)
  const info = cardMeta(comment.card_id)
  return {
    record_id: `comment:${comment.id}`,
    kind: 'comment',
    author: comment.author,
    text: comment.body,
    choice: null,
    timestamp: comment.created_at,
    date: comment.created_at.slice(0, 10),
    area: info.area,
    topic: topicFor(comment.body),
    source: sourceFor(comment.card_id),
    assessment: rule,
    raw: comment,
  }
}

function normalizeNote(pick) {
  const rule = NOTE_RULES.get(noteKey(pick.card_id, pick.author))
  if (!rule) throw new Error(`No classification rule for note ${pick.card_id} / ${pick.author}`)
  const info = cardMeta(pick.card_id)
  return {
    record_id: `vote-note:${pick.id}`,
    kind: 'vote_note',
    author: pick.author,
    text: pick.note,
    choice: pick.choice,
    timestamp: pick.updated_at,
    date: pick.updated_at.slice(0, 10),
    area: info.area,
    topic: topicFor(pick.note),
    source: sourceFor(pick.card_id),
    assessment: rule,
    raw: pick,
  }
}

const records = [...comments.map(normalizeComment), ...writtenNotes.map(normalizeNote)]
  .sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.record_id.localeCompare(b.record_id))

function countBy(values, getter) {
  return Object.fromEntries(
    [...values.reduce((map, value) => {
      const key = getter(value)
      map.set(key, (map.get(key) ?? 0) + 1)
      return map
    }, new Map())].sort(([a], [b]) => a.localeCompare(b)),
  )
}

function areaBreakdown(values) {
  const areas = new Map()
  for (const record of values) {
    const row = areas.get(record.area) ?? { total: 0, accepted: 0, refuted: 0, missed: 0 }
    row.total += 1
    row[record.assessment.disposition] += 1
    areas.set(record.area, row)
  }
  return Object.fromEntries([...areas].sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0])))
}

const exportData = {
  schema_version: '1.0.0',
  generated_at: GENERATED_AT,
  title: 'Axiia Cup HTML Review Feedback Audit',
  scope: {
    included: [
      'Every live row in the shared Supabase comments table',
      'Every Supabase pick row whose note field contains written feedback',
    ],
    excluded: [
      'Votes with an empty note field (a choice is not a written comment)',
      'Deleted comments, because the source database hard-deletes them and exposes no audit history',
      'Browser-local-only feedback that was never synchronized to Supabase',
    ],
    source_endpoint: `${supabaseUrl}/rest/v1`,
    source_snapshot: {
      comments_table_rows: comments.length,
      picks_table_rows: allPicks.length,
      picks_with_written_notes: writtenNotes.length,
      exported_written_records: records.length,
    },
  },
  methodology: {
    disposition_definitions: {
      accepted: 'The proposal, correction, clarification, or explicit deferral is reflected in a decision, current specification, tracked plan, or implementation.',
      refuted: 'The proposal was explicitly rejected, contradicted by the final decision, or later overturned.',
      missed: 'No evidence of handling was found, or the item remains unaddressed. Non-actionable test/smoke records are retained here with progress=not_applicable.',
    },
    progress_note: 'Disposition and progress are separate. An accepted item may be deferred or only partially implemented; a refuted item may still have one accepted subclaim.',
    evidence_basis: Object.values(EVIDENCE),
    audit_limitations: [
      'The source rows have no native accepted/refuted/resolved status. Classifications are an evidence-based audit inference.',
      'Some comments contain multiple claims. The required top-level disposition uses accepted/refuted/missed, while assessment.components preserves mixed subclaim outcomes.',
      '“Implemented” means evidence exists in the inspected workspace or merged implementation branch; it does not independently prove production deployment.',
    ],
  },
  summary: {
    total: records.length,
    by_kind: countBy(records, (record) => record.kind),
    by_disposition: countBy(records, (record) => record.assessment.disposition),
    by_progress: countBy(records, (record) => record.assessment.progress.state),
    by_date: countBy(records, (record) => record.date),
    by_author: countBy(records, (record) => record.author),
    by_area: areaBreakdown(records),
  },
  records,
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const embeddedJson = JSON.stringify(exportData).replaceAll('</script', '<\\/script')
const disposition = exportData.summary.by_disposition

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(exportData.title)}</title>
<style>
:root{--bg:#f3f1eb;--paper:#fffdf8;--ink:#1d2524;--muted:#68706d;--line:#dedbd2;--green:#1e7655;--green-bg:#e4f2ea;--red:#a33e35;--red-bg:#f7e7e4;--amber:#99640d;--amber-bg:#f8edce;--blue:#285d86;--blue-bg:#e6eff6;--shadow:0 1px 2px rgba(28,37,36,.05),0 12px 36px rgba(28,37,36,.06);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);background:var(--bg)}
*{box-sizing:border-box}body{margin:0;background:linear-gradient(180deg,#ede9dd 0,#f3f1eb 320px);color:var(--ink)}a{color:var(--blue);text-decoration:none}a:hover{text-decoration:underline}button,input,select{font:inherit}.wrap{width:min(1440px,calc(100% - 32px));margin:auto}.hero{padding:52px 0 28px}.eyebrow{text-transform:uppercase;letter-spacing:.16em;font-size:11px;font-weight:800;color:var(--muted)}h1{font-size:clamp(32px,5vw,62px);letter-spacing:-.055em;line-height:.98;max-width:950px;margin:12px 0 18px}.lede{max-width:850px;color:var(--muted);font-size:16px;line-height:1.65;margin:0}.hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px}.button{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line);border-radius:10px;background:var(--paper);padding:9px 13px;font-weight:700;font-size:13px;color:var(--ink);cursor:pointer}.button.primary{background:var(--ink);border-color:var(--ink);color:white}.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:22px 0}.stat{background:rgba(255,253,248,.92);border:1px solid var(--line);border-radius:15px;padding:18px;box-shadow:var(--shadow)}.stat b{display:block;font-size:34px;letter-spacing:-.04em}.stat span{color:var(--muted);font-size:12px;font-weight:700}.stat.accepted b{color:var(--green)}.stat.refuted b{color:var(--red)}.stat.missed b{color:var(--amber)}.panel{background:rgba(255,253,248,.94);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:18px;margin:14px 0}.panel h2{margin:0 0 12px;font-size:17px}.method{font-size:13px;color:var(--muted);line-height:1.55}.filters{position:sticky;top:0;z-index:20;background:rgba(243,241,235,.94);backdrop-filter:blur(16px);border-block:1px solid var(--line);padding:12px 0}.filter-grid{display:grid;grid-template-columns:minmax(240px,1.5fr) repeat(3,minmax(150px,.6fr));gap:10px}.control{width:100%;border:1px solid var(--line);border-radius:9px;background:var(--paper);color:var(--ink);padding:9px 11px}.result-line{display:flex;justify-content:space-between;gap:12px;margin:14px 0;color:var(--muted);font-size:13px}.area-table{width:100%;border-collapse:collapse;font-size:13px}.area-table th,.area-table td{padding:9px 8px;border-bottom:1px solid var(--line);text-align:right}.area-table th:first-child,.area-table td:first-child{text-align:left}.area-table th{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em}.bar{height:7px;border-radius:999px;display:flex;overflow:hidden;background:#ece9e1;min-width:130px}.bar i{display:block;height:100%}.bar .a{background:var(--green)}.bar .r{background:var(--red)}.bar .m{background:var(--amber)}.records{display:grid;gap:12px;padding-bottom:80px}.record{background:var(--paper);border:1px solid var(--line);border-radius:15px;padding:17px 18px;box-shadow:var(--shadow);scroll-margin-top:90px}.record[data-disposition="missed"]{border-left:4px solid var(--amber)}.record[data-disposition="refuted"]{border-left:4px solid var(--red)}.record[data-disposition="accepted"]{border-left:4px solid var(--green)}.record-head{display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap}.record-title{font-size:14px;font-weight:800;margin-right:auto}.badges{display:flex;gap:6px;flex-wrap:wrap}.badge{display:inline-flex;align-items:center;border-radius:999px;padding:3px 8px;font-size:10.5px;font-weight:800;border:1px solid transparent}.badge.accepted{color:var(--green);background:var(--green-bg)}.badge.refuted{color:var(--red);background:var(--red-bg)}.badge.missed{color:var(--amber);background:var(--amber-bg)}.badge.progress{color:var(--blue);background:var(--blue-bg)}.badge.kind{color:var(--muted);border-color:var(--line);background:#f3f1eb}.meta{display:flex;flex-wrap:wrap;gap:8px 14px;margin-top:8px;font-size:11.5px;color:var(--muted)}.quote{white-space:pre-wrap;font-size:14px;line-height:1.65;margin:14px 0;padding:13px 15px;border-radius:10px;background:#f5f2eb;border:1px solid #e8e4da}.choice{font-size:12px;color:var(--blue);font-weight:700;margin-top:-6px}.audit{border-top:1px solid var(--line);padding-top:12px;display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.65fr);gap:18px}.audit p{margin:0;font-size:12.5px;line-height:1.55;color:#4f5754}.evidence{font-size:11.5px}.evidence b{display:block;margin-bottom:4px}.evidence ul{margin:0;padding-left:17px}.components{margin:9px 0 0;padding-left:18px;font-size:11.5px;color:var(--muted)}.empty{display:none;text-align:center;padding:40px;color:var(--muted)}.footer{padding:25px 0 50px;color:var(--muted);font-size:12px}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.hidden{display:none!important}@media(max-width:850px){.stats{grid-template-columns:repeat(2,1fr)}.filter-grid{grid-template-columns:1fr 1fr}.filter-grid .search{grid-column:1/-1}.audit{grid-template-columns:1fr}.area-table{font-size:11.5px}}@media(max-width:520px){.wrap{width:min(100% - 20px,1440px)}.hero{padding-top:34px}.stats{grid-template-columns:1fr 1fr}.stat b{font-size:28px}.filter-grid{grid-template-columns:1fr}.filter-grid .search{grid-column:auto}.area-table .optional{display:none}.record{padding:14px}.record-head{display:block}.badges{margin-top:8px}}
.records,.record{min-width:0}.record a,.record p,.record li,.record-title,.choice{overflow-wrap:anywhere}
@media(max-width:520px){.wrap{width:min(calc(100% - 20px),1440px)}}
</style>
</head>
<body>
<header class="hero"><div class="wrap">
  <div class="eyebrow">Axiia Cup · feedback evidence audit · ${escapeHtml(AUDIT_DATE)}</div>
  <h1>Every shared HTML review comment, in one place.</h1>
  <p class="lede">A lossless export of ${records.length} written feedback records—${comments.length} comments and ${writtenNotes.length} vote notes—categorized by product area, date, progress, and whether the current evidence shows them as accepted, refuted, or missed.</p>
  <div class="hero-actions"><a class="button primary" href="feedback-audit.json" download>↓ Download JSON</a><button class="button" id="missedOnly">Show missed queue</button><a class="button" href="${DEPLOY_BASE}/v3-hub" target="_blank" rel="noopener">Open source hub ↗</a></div>
  <div class="stats">
    <div class="stat"><b>${records.length}</b><span>Total written records</span></div>
    <div class="stat accepted"><b>${disposition.accepted ?? 0}</b><span>Accepted</span></div>
    <div class="stat refuted"><b>${disposition.refuted ?? 0}</b><span>Refuted</span></div>
    <div class="stat missed"><b>${disposition.missed ?? 0}</b><span>Missed / not dealt with</span></div>
  </div>
</div></header>

<main>
<section class="wrap panel">
  <h2>How status was determined</h2>
  <p class="method"><b>Accepted</b> means the feedback appears in a decision, current spec, tracked plan, or implementation—including explicit deferrals. <b>Refuted</b> means a final decision rejected or later overturned it. <b>Missed</b> means no handling evidence was found. Progress is separate, so an accepted record can still be deferred or partial. Mixed comments preserve per-claim results inside the card. These statuses are audit inferences because the source database has no native resolution field.</p>
</section>

<section class="wrap panel">
  <h2>Coverage by area</h2>
  <div style="overflow:auto"><table class="area-table" id="areaTable"><thead><tr><th>Area</th><th>Total</th><th>Accepted</th><th>Refuted</th><th>Missed</th><th class="optional">Distribution</th></tr></thead><tbody></tbody></table></div>
</section>

<div class="filters"><div class="wrap filter-grid">
  <input class="control search" id="search" type="search" placeholder="Search comments, authors, cards, rationale…" aria-label="Search feedback">
  <select class="control" id="area" aria-label="Filter by area"><option value="">All areas</option></select>
  <select class="control" id="status" aria-label="Filter by disposition"><option value="">All dispositions</option><option value="accepted">Accepted</option><option value="refuted">Refuted</option><option value="missed">Missed</option></select>
  <select class="control" id="progress" aria-label="Filter by progress"><option value="">All progress states</option></select>
</div></div>

<section class="wrap">
  <div class="result-line"><span id="resultCount"></span><span>Newest first · source text preserved verbatim</span></div>
  <div class="records" id="records"></div>
  <div class="empty" id="empty">No feedback matches these filters.</div>
</section>
</main>

<footer class="footer"><div class="wrap">Generated ${escapeHtml(GENERATED_AT)} · Source rows remain in <span class="mono">raw</span> inside the companion JSON · Deleted and browser-local-only comments cannot be recovered.</div></footer>

<script id="feedback-data" type="application/json">${embeddedJson}</script>
<script>
const DATA=JSON.parse(document.getElementById('feedback-data').textContent);
const records=[...DATA.records].sort((a,b)=>b.timestamp.localeCompare(a.timestamp));
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const filters={search:'',area:'',status:'',progress:''};
const unique=(key)=>[...new Set(records.map(r=>key(r)))].sort((a,b)=>a.localeCompare(b));
for(const area of unique(r=>r.area)) $('area').insertAdjacentHTML('beforeend','<option>'+esc(area)+'</option>');
for(const state of unique(r=>r.assessment.progress.state)) $('progress').insertAdjacentHTML('beforeend','<option value="'+esc(state)+'">'+esc(DATA.records.find(r=>r.assessment.progress.state===state).assessment.progress.label)+'</option>');

function sourceLink(record){const s=record.source;return '<a href="'+esc(s.web_url)+'" target="_blank" rel="noopener">'+esc(s.label)+'</a> · <span class="mono">'+esc(s.card_id)+'</span>'}
function evidenceHtml(record){if(!record.assessment.evidence.length)return '<span>No external evidence link; classified from source context.</span>';return '<b>Evidence</b><ul>'+record.assessment.evidence.map(e=>'<li><a href="'+esc(e.web_url)+'" target="_blank" rel="noopener">'+esc(e.label)+'</a></li>').join('')+'</ul>'}
function componentsHtml(record){const parts=record.assessment.components||[];if(!parts.length)return '';return '<ul class="components">'+parts.map(p=>'<li><b>'+esc(p.disposition)+':</b> '+esc(p.claim)+'</li>').join('')+'</ul>'}
function recordHtml(record){const a=record.assessment;const haystack=[record.text,record.author,record.area,record.topic,record.source.card_title,record.source.card_id,a.rationale,a.progress.label].join(' ').toLowerCase();return '<article class="record" id="'+esc(record.record_id.replace(':','-'))+'" data-area="'+esc(record.area)+'" data-disposition="'+esc(a.disposition)+'" data-progress="'+esc(a.progress.state)+'" data-haystack="'+esc(haystack)+'"><div class="record-head"><div class="record-title">'+esc(record.source.card_title)+'</div><div class="badges"><span class="badge '+esc(a.disposition)+'">'+esc(a.disposition)+'</span><span class="badge progress">'+esc(a.progress.label)+'</span><span class="badge kind">'+esc(record.kind==='comment'?'comment':'vote note')+'</span></div></div><div class="meta"><span>'+esc(record.date)+'</span><span>by <b>'+esc(record.author)+'</b></span><span>'+esc(record.area)+'</span><span>'+esc(record.topic)+'</span><span>'+sourceLink(record)+'</span></div><div class="quote">'+esc(record.text)+'</div>'+(record.choice?'<div class="choice">Recorded choice: '+esc(record.choice)+'</div>':'')+'<div class="audit"><div><p><b>Audit:</b> '+esc(a.rationale)+'</p>'+componentsHtml(record)+'</div><div class="evidence">'+evidenceHtml(record)+'</div></div></article>'}
$('records').innerHTML=records.map(recordHtml).join('');

function renderAreaTable(){const body=Object.entries(DATA.summary.by_area).map(([name,row])=>{const pct=n=>row.total?100*n/row.total:0;return '<tr><td>'+esc(name)+'</td><td>'+row.total+'</td><td>'+row.accepted+'</td><td>'+row.refuted+'</td><td>'+row.missed+'</td><td class="optional"><div class="bar" aria-label="'+esc(name)+' distribution"><i class="a" style="width:'+pct(row.accepted)+'%"></i><i class="r" style="width:'+pct(row.refuted)+'%"></i><i class="m" style="width:'+pct(row.missed)+'%"></i></div></td></tr>'}).join('');$('areaTable').querySelector('tbody').innerHTML=body}
renderAreaTable();

function apply(){let visible=0;for(const el of document.querySelectorAll('.record')){const ok=(!filters.search||el.dataset.haystack.includes(filters.search))&&(!filters.area||el.dataset.area===filters.area)&&(!filters.status||el.dataset.disposition===filters.status)&&(!filters.progress||el.dataset.progress===filters.progress);el.classList.toggle('hidden',!ok);if(ok)visible++}$('resultCount').textContent=visible+' of '+records.length+' records';$('empty').style.display=visible?'none':'block'}
$('search').addEventListener('input',e=>{filters.search=e.target.value.trim().toLowerCase();apply()});
for(const id of ['area','status','progress']) $(id).addEventListener('change',e=>{filters[id]=e.target.value;apply()});
$('missedOnly').addEventListener('click',()=>{filters.status='missed';$('status').value='missed';apply();document.querySelector('.filters').scrollIntoView({behavior:'smooth'})});
apply();
</script>
</body>
</html>
`

await mkdir(outputDir, { recursive: true })
await writeFile(jsonPath, `${JSON.stringify(exportData, null, 2)}\n`, 'utf8')
await writeFile(htmlPath, html, 'utf8')

console.log(JSON.stringify({
  json: jsonPath,
  html: htmlPath,
  comments: comments.length,
  vote_notes: writtenNotes.length,
  total: records.length,
  dispositions: exportData.summary.by_disposition,
  progress: exportData.summary.by_progress,
}, null, 2))
