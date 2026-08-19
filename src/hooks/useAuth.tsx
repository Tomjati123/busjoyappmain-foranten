import { useNavigate } from "react-router-dom";

export type AppRole = "admin" | "staff" | "passenger";
type User = { id?: number; username?: string; role?: string; [key: string]: any } | null;


export const setAuth = (payload: { token?: string; user?: User } | any) => {
  if (payload?.token) localStorage.setItem("token", payload.token);
  const u = payload?.user || payload?.admin || payload?.employee || payload?.passenger || null;
  if (u) localStorage.setItem("user", JSON.stringify(u));
};

export const getToken = (): string | null => {
  const token = localStorage.getItem("token");
  if (!token || token === "undefined" || token === "null" || token === '""') return null;
  return token;
};

export const getUser = (): User => {
  const raw = localStorage.getItem("user");
  try {
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const isAuthenticated = (): boolean => !!getToken() && !!getUser();

export const getUserRole = (user: User = getUser()): AppRole | null => {
  if (!user) return null;
  if (user.role === "admin") return "admin";
  if (user.role === "staff") return "staff";
  return "passenger";
};

export const getDefaultPathForRole = (role: AppRole | null): string => {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  if (role === "passenger") return "/passenger";
  return "/login";
};

export const getDefaultPathForUser = (user: User = getUser()): string => {
  return getDefaultPathForRole(getUserRole(user));
};

export const logout = (redirectTo = "/") => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = redirectTo;
};

export default function useAuth() {
  const navigate = useNavigate();
  const login = (payload: any) => {
    setAuth(payload);
    const user = payload?.user || payload?.admin || payload?.employee || payload?.passenger || null;
    if (!user) {
      navigate("/");
      return;
    }

    navigate(getDefaultPathForUser(user), { replace: true });
  };
  return { login, logout, getUser, getToken, isAuthenticated };
}
