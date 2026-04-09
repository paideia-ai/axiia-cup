import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'

export type AdminPageSection =
  | 'tournaments'
  | 'players'
  | 'monitor'
  | 'settings'

const adminSections: { key: AdminPageSection; label: string }[] = [
  { key: 'tournaments', label: '赛事' },
  { key: 'players', label: '选手' },
  { key: 'monitor', label: '监控' },
  { key: 'settings', label: '设置' },
]

export function AdminPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const activeSection = useMemo<AdminPageSection>(() => {
    const matchedSection = adminSections.find((section) =>
      location.pathname.startsWith(`/admin/${section.key}`),
    )

    return matchedSection?.key ?? 'tournaments'
  }, [location.pathname])

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Tabs
          onValueChange={(value) => navigate(`/admin/${value}`)}
          value={activeSection}
        >
          <TabsList>
            {adminSections.map((section) => (
              <TabsTrigger key={section.key} value={section.key}>
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Outlet />
    </div>
  )
}
