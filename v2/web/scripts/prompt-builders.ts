// Build-time only: package reviewed product templates and runtime references.
// Research documents are not a build input.
import { readFileSync, writeFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

const root = new URL('../../../', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), 'utf8')
const artifact = '〔玩家在外部 AI 中确认后生成的策略；比赛时由系统合并〕'
const pending = '〔真假标记由系统在比赛时分配，此处不预设〕'

export interface BuilderAsset {
  side: 'a' | 'b'
  template: string
  references: Record<string, string>
}

export function generatePromptBuilders(): {
  roles: Record<string, Record<string, BuilderAsset>>
  otherRules: string
  fallback: string
  roleSelection: string
} {
  const result: Record<string, Record<string, BuilderAsset>> = {}
  const definitions: Record<
    string,
    Record<string, { side: 'a' | 'b'; file: string }>
  > = JSON.parse(read('v2/prompt-builders/manifest.json'))

  for (const [id, roles] of Object.entries(definitions)) {
    const source = read(`v2/scenarios/scenarios/${id}/script.js`)
    const defaultRounds = (parameter: string) => {
      const match = source.match(
        new RegExp(`game\\.params\\.${parameter} \\?\\? (\\d+)`),
      )
      if (!match) throw new Error(`${id}: missing default ${parameter}`)
      return Number(match[1])
    }
    // Evaluate only declarations and explicit reference expressions. No match,
    // LLM, random draw, or player data is used. Timeout catches source drift.
    const evaluate = (expression: string, declarations = source) =>
      runInNewContext(
        `${declarations}\n;${expression}`,
        { artifact, pending },
        { timeout: 1000 },
      )
    result[id] = {}
    for (const [key, { side, file }] of Object.entries(roles)) {
      if (side !== 'a' && side !== 'b') {
        throw new Error(`${id}/${key}: invalid side`)
      }
      const template = read(`v2/prompt-builders/${file}`).trim()
      if (!template) throw new Error(`${id}/${key}: empty product template`)
      let references: Record<string, string>
      if (id === 'legal-harbor-murder-jury') {
        // Harbor declares its reference material inside main. Stop before agent
        // creation; never execute main or expose later action/reasoning prompts.
        const start = source.indexOf('  const evidenceById =')
        const end = source.indexOf('  const players =')
        const final = source.match(/`【最终判决】公开审议已经结束。[\s\S]*?`/g)
        if (start < 0 || end <= start || final?.length !== 1) {
          throw new Error('Harbor reference boundaries changed')
        }
        references = evaluate(
          `({
          agent_prompt_template: playerSystem(${
            side === 'a'
              ? "10, '林', '现有证据整体已经排除合理怀疑，应判顾衡有罪', 'GUILTY'"
              : "11, '苏', '控方尚未排除由证据支持的合理怀疑，应判顾衡无罪', 'NOT_GUILTY'"
          }, artifact),
          public_case_packet: publicCasePacket,
          player_visible_rules: roster + '\\n\\n' + procedure,
          npc_juror_system_prompt_template: npcSystem({seat: '〔席位〕', name: '〔姓名〕', text: '〔对应下方 persona〕'}),
          npc_juror_personas: personas.map(p => p.seat + '. ' + p.name + '\\n' + p.text).join('\\n\\n'),
          npc_final_verdict_prompt: ${final[0]},
        })`,
          source.slice(start, end),
        )
      } else if (id === 'honnoji-decision') {
        references = evaluate(`(() => {
          const role = ROLES[ROLE_ALIASES[${JSON.stringify(key)}]];
          const opponents = Object.values(ROLES).filter(r => r.side !== role.side);
          return {
            agent_prompt_template: opponents.map(opponent => {
              const roleA = role.side === 'a' ? role : opponent;
              const roleB = role.side === 'b' ? role : opponent;
              return '【可能对阵：' + opponent.name + '；比赛时只使用实际对手】\\n' + playerSystem({
                role, roleA, roleB, opponent, rounds: ${
          defaultRounds('roundCount')
        }, artifact,
                requests: opponentRequestList(role.requests) + '\\n' + pending,
                opponentRequests: opponentRequestList(opponent.requests),
              });
            }).join('\\n\\n'),
            judge_prompt: Object.entries(ROLES).filter(([,r]) => r.side !== role.side).map(([oppKey, opponent]) =>
              '【可能对阵：' + opponent.name + '】\\n' + judgeSystem(
                role.side === 'a' ? ROLE_ALIASES[${
          JSON.stringify(key)
        }] : oppKey,
                role.side === 'b' ? ROLE_ALIASES[${
          JSON.stringify(key)
        }] : oppKey
              )).join('\\n\\n'),
          };
        })()`)
      } else if (id === 'shangyang-court') {
        const own = side === 'a' ? 'A' : 'B'
        const opp = side === 'a' ? 'B' : 'A'
        references = evaluate(`({
          agent_prompt_template: playerSystem({roleName: NAME_${own}, opponentName: NAME_${opp},
            requests: opponentRequestList(REQUESTS_${own}) + '\\n' + pending,
            opponentRequests: opponentRequestList(REQUESTS_${opp}), rounds: ${
          defaultRounds('roundCount')
        }, artifact}),
          judge_prompt: judgeSystem,
        })`)
      } else if (id === 'trolley-problem') {
        const own = side === 'a' ? 'A' : 'B'
        const opp = side === 'a' ? 'B' : 'A'
        references = evaluate(`({
          agent_prompt_template: playerSystem({me: NAME_${own}, side: SIDE_${own},
            opponent: NAME_${opp}, opponentSide: SIDE_${opp}, cases: caseBlock(CASES), rounds: ${
          defaultRounds('caseRounds')
        }, artifact}),
          judge_prompt: judgeSystem(CASES),
        })`)
      } else {
        references = evaluate(`({
          agent_prompt_template: playerSystem(${
          side === 'a' ? "'董卓', '吕布'" : "'吕布', '董卓'"
        }, artifact),
          judge_prompt: diaochanSystem,
        })`)
      }
      for (const [name, value] of Object.entries(references)) {
        if (
          typeof value !== 'string' || !value.trim() ||
          /undefined|NaN/.test(value)
        ) {
          throw new Error(`${id}/${key}: invalid ${name}`)
        }
      }
      result[id][key] = {
        side,
        template,
        references,
      }
    }
  }
  return {
    roles: result,
    otherRules: read('v2/prompt-builders/shared/other-rules.md').trim(),
    fallback: read('v2/prompt-builders/shared/fallback.md').trim(),
    roleSelection: read('v2/prompt-builders/shared/role-selection.md').trim(),
  }
}

if (process.argv.includes('--write')) {
  writeFileSync(
    new URL('../src/scenarios/prompt-builders.json', import.meta.url),
    JSON.stringify(generatePromptBuilders(), null, 2) + '\n',
  )
}
