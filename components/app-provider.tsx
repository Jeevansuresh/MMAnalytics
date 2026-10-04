"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { MockState, Role, Session } from "@/lib/api/types";
import { api } from "@/lib/api/client";
import { getSession, setSession } from "@/lib/auth/session";
interface AppContext {
  session: Session;
  ready: boolean;
  bootError: string | null;
  state: MockState;
  setState: (state: MockState) => void;
  switchRole: (role: Role) => void;
  theme: string;
  toggleTheme: () => void;
}
const Context = createContext<AppContext | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, updateSession] = useState<Session>(() =>
    getSession({ role: "ceo" }),
  );
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [state, setState] = useState<MockState>("success");
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    let live = true;
    api
      .me()
      .then((value) => {
        if (live) {
          updateSession(value);
          setReady(true);
        }
      })
      .catch((err: unknown) => {
        if (live)
          setBootError(
            err instanceof Error ? err.message : "Unable to start mocks.",
          );
      });
    const saved = localStorage.getItem("mmanalytics-theme-v2") ?? "light";
    document.documentElement.dataset.theme = saved;
    // Synchronize the external storage snapshot after mount.
    queueMicrotask(() => {
      if (live) setTheme(saved);
    });
    return () => {
      live = false;
    };
  }, []);
  const switchRole = (role: Role) => {
    const next = setSession(role);
    updateSession(next);
  };
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("mmanalytics-theme-v2", next);
  };
  return (
    <Context.Provider
      value={{
        session,
        ready,
        bootError,
        state,
        setState,
        switchRole,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error("AppProvider is required.");
  return context;
}
