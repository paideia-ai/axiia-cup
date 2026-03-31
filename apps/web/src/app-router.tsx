import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/layout/app-shell";
import { useAuth } from "./context/auth";
import { AdminPage } from "./pages/admin-page";
import { DashboardPage } from "./pages/dashboard-page";
import { LeaderboardPage } from "./pages/Leaderboard";
import { LoginPage } from "./pages/Login";
import { MatchDetailPage } from "./pages/MatchDetail";
import { PlaygroundPage } from "./pages/Playground";
import { RegisterPage } from "./pages/Register";
import { ScenarioDetailPage } from "./pages/ScenarioDetail";
import { ScenariosPage } from "./pages/Scenarios";
import { SettingsPage } from "./pages/settings-page";

function ProtectedShell() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-sm text-[var(--foreground-subtle)]">
        正在恢复会话...
      </div>
    );
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate replace to="/dashboard" />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/scenarios" element={<ScenariosPage />} />
        <Route path="/scenarios/:scenarioId" element={<ScenarioDetailPage />} />
        <Route path="/playground/:submissionId" element={<PlaygroundPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/matches/:matchId" element={<MatchDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </AppShell>
  );
}

export function AppRouter() {
  const { isLoading, user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate replace to={user ? "/scenarios" : "/login"} />} />
        <Route path="/login" element={isLoading ? <div /> : user ? <Navigate replace to="/dashboard" /> : <LoginPage />} />
        <Route path="/register" element={isLoading ? <div /> : user ? <Navigate replace to="/dashboard" /> : <RegisterPage />} />
        <Route path="/*" element={<ProtectedShell />} />
      </Routes>
    </BrowserRouter>
  );
}
