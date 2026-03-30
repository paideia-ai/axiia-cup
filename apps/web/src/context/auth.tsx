import type { User } from "@axiia/shared";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

import { clearToken, getMe, readToken, storeToken } from "../lib/api";

type AuthContextValue = {
  isLoading: boolean;
  login: (payload: { token: string; user: User }) => void;
  logout: () => void;
  token: null | string;
  user: null | User;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() => readToken());
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getMe();
        setUser(currentUser);
      } catch {
        clearToken();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      login: ({ token: nextToken, user: nextUser }) => {
        storeToken(nextToken);
        setToken(nextToken);
        setUser(nextUser);
      },
      logout: () => {
        clearToken();
        setToken(null);
        setUser(null);
      },
      token,
      user,
    }),
    [isLoading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
