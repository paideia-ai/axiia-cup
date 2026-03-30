import { LayoutDashboard, ScrollText, Settings, Shield, Swords, Trophy } from "lucide-react";
import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/auth";
import { cn } from "../../lib/cn";
import { Button } from "../ui/button";

const navigation = [
  { to: "/scenarios", label: "场景", icon: ScrollText },
  { to: "/scenarios/shangyang-court", label: "工坊", icon: LayoutDashboard },
  { to: "/playground", label: "试炼场", icon: Swords },
  { to: "/leaderboard", label: "排行榜", icon: Trophy },
  { to: "/settings", label: "设置", icon: Settings },
  { to: "/admin", label: "Admin", icon: Shield },
];

export function AppShell({ children }: PropsWithChildren) {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border-soft)] bg-[rgba(12,12,12,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          <NavLink to="/" className="mr-4 text-sm font-black tracking-[0.24em] text-[var(--accent)]">
            AXIIA CUP
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[var(--foreground-subtle)] transition hover:bg-white/4 hover:text-[var(--foreground)]",
                    isActive && "bg-white/6 text-[var(--foreground)]",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">MVP</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{user?.displayName ?? "momo"}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(224,74,47,0.2)] bg-[rgba(224,74,47,0.12)] font-mono text-xs text-[var(--accent)]">
              {(user?.displayName ?? "momo").slice(0, 2).toUpperCase()}
            </div>
            <Button size="sm" variant="secondary" onClick={logout}>
              退出
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
