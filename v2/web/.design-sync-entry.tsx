// Bundle entry for /design-sync. v2/web is an app, not a published library, so
// there is no dist/ whose exports the converter could read — this barrel is the
// export surface it bundles into window.AxiiaWeb instead. Committed sync state:
// re-syncs read it via cfg.entry, and a component missing here never reaches
// claude.ai/design. Nothing in the app imports this file.

import type { ReactNode } from 'react'

export { Accordion, AccordionItem } from './src/components/ui/accordion'
export { Badge } from './src/components/ui/badge'
export { Button } from './src/components/ui/button'
export {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from './src/components/ui/card'
export { Input } from './src/components/ui/input'
export { ScrollArea } from './src/components/ui/scroll-area'
export { Select, SelectItem } from './src/components/ui/select'
export {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './src/components/ui/tabs'
export { Textarea } from './src/components/ui/textarea'

export { BattleStrip } from './src/components/battle-strip'
export { InitModes } from './src/components/builder-init'
export { JudgeTrendChart } from './src/components/judge-trend'
export { NewAgentDialog } from './src/components/new-agent-dialog'
export { OsPanel } from './src/components/os-panel'
export { ReplayControls } from './src/components/replay-controls'
export { ScriptView } from './src/components/script-view'
export { VerdictCard } from './src/components/verdict-card'
export { VersionList } from './src/components/version-list'
export { AppShell } from './src/components/layout/app-shell'

// Preview provider only (cfg.provider). Components that render <Link>/<NavLink>
// throw outside a router, so every preview mounts inside this. Not part of the
// design system's API — the app supplies its own router.
export { MemoryRouter } from 'react-router-dom'

// Preview provider only (cfg.provider). This design system is dark-only — the
// app paints --background on :root — but the generated preview card scaffolds
// each cell on white. Components then render --foreground (#e8e8e8) text on
// white, which is close to invisible. This restores the surface the components
// were designed against. Not part of the design system's API.
export function PreviewFrame({ children }: { children?: ReactNode }) {
  return (
    <div className='rounded-lg bg-(--background) p-5 text-(--foreground)'>
      {children}
    </div>
  )
}
