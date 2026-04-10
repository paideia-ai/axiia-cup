import { Command } from 'commander'

import { registerAnalyticsCommands } from './commands/analytics'
import { registerAuthCommands } from './commands/auth'
import { registerMonitorCommands } from './commands/monitor'
import { registerPlaygroundCommands } from './commands/playground'
import { registerScenarioCommands } from './commands/scenarios'
import { registerTournamentCommands } from './commands/tournaments'
import { registerUserCommands } from './commands/users'

const program = new Command()

program.name('axiia').description('Axiia Cup admin CLI').version('0.1.0')

registerAuthCommands(program)
registerTournamentCommands(program)
registerScenarioCommands(program)
registerUserCommands(program)
registerPlaygroundCommands(program)
registerAnalyticsCommands(program)
registerMonitorCommands(program)

program.parseAsync().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Unknown CLI error')
  process.exit(1)
})
