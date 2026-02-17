import { ActionEndpoints, AuthSession, AuthUser } from "./types";

export const DEFAULT_ENDPOINTS: ActionEndpoints = {
  login: "",
  register: "",
  me: "",
  logout: "",
  logoutAll: "",
  requestPasswordReset: "",
  resetPassword: "",
  requestEmailUpdate: "",
  confirmEmailUpdate: "",
  verifyEmail: "",
  revokeRegister: "",
  revokeEmailUpdate: "",
  updateProfile: "",
  updateAvatar: "",
  deleteAccount: "",
};

export const EMPTY_SESSION: AuthSession = {
  isAuthenticated: false,
  user: null,
  updatedAt: Date.now(),
};

export const mergeEndpoints = (custom?: Partial<ActionEndpoints>): ActionEndpoints => ({
  ...DEFAULT_ENDPOINTS,
  ...(custom ?? {}),
});

export const toQueryString = (payload: Record<string, unknown>) => {
  const params = new URLSearchParams();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, String(entry)));
      return;
    }

    params.append(key, String(value));
  });

  return params.toString();
};

export const defaultTransformUser = (payload: unknown): AuthUser | null => {
  if (!payload || typeof payload !== "object") return null;

  const raw = payload as Record<string, unknown>;
  const fromData = raw.data && typeof raw.data === "object" ? (raw.data as Record<string, unknown>) : null;

  if (raw.user && typeof raw.user === "object") {
    return raw.user as AuthUser;
  }

  if (fromData?.user && typeof fromData.user === "object") {
    return fromData.user as AuthUser;
  }

  return null;
};
