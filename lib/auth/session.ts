import type { Role, Session } from "@/lib/api/types";

export const SESSION_KEY = "mmanalytics-demo-session";
export const roles: Role[] = ["ceo", "admin", "campus_lead"];
export function getSession(override?: {
  role?: Role;
  campusId?: string;
}): Session {
  let role: Role = override?.role ?? "ceo";
  let campusId = override?.campusId ?? "christ";
  if (!override && typeof window !== "undefined") {
    try {
      const saved = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null");
      if (saved && roles.includes(saved.role)) {
        role = saved.role;
        campusId =
          typeof saved.campusId === "string" ? saved.campusId : "christ";
      }
    } catch {
      /* Storage is optional in this UI stub. */
    }
  }
  return {
    user: {
      id: "demo-operator",
      name:
        role === "ceo"
          ? "Executive workspace"
          : role === "admin"
            ? "Admin workspace"
            : "Campus workspace",
    },
    role,
    campusId: role === "campus_lead" ? campusId : null,
    managedUsers:
      role === "admin"
        ? [
            {
              id: "staff-01",
              label: "Campus operations",
              role: "campus_lead",
              campusId: "christ",
              enabled: true,
            },
            {
              id: "staff-02",
              label: "Growth operations",
              role: "admin",
              campusId: null,
              enabled: true,
            },
          ]
        : [],
  };
}
export function setSession(role: Role, campusId = "christ") {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ role, campusId }));
    } catch {
      /* Continue without persistence. */
    }
  }
  return getSession({ role, campusId });
}
// Any input is accepted. Never store the entered identifier or password.
export function login() {
  return setSession("ceo");
}
export function logout() {
  if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
}
