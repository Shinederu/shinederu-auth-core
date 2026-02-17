export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type AuthUser = {
  id?: number | string;
  username?: string;
  email?: string;
  role?: string;
  avatar_url?: string;
  created_at?: string;
  [key: string]: unknown;
};

export type AuthSession = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  updatedAt: number;
};

export type AuthCredentials = {
  username: string;
  password: string;
};

export type AuthRegisterPayload = {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
};

export type AuthRequestConfig = {
  method?: HttpMethod;
  payload?: Record<string, unknown> | FormData | null;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
};

export type ActionEndpoints = {
  login: string;
  register: string;
  me: string;
  logout: string;
  logoutAll: string;
  requestPasswordReset: string;
  resetPassword: string;
  requestEmailUpdate: string;
  confirmEmailUpdate: string;
  verifyEmail: string;
  revokeRegister: string;
  revokeEmailUpdate: string;
  updateProfile: string;
  updateAvatar: string;
  deleteAccount: string;
};

export type AuthState = {
  session: AuthSession;
  isLoading: boolean;
  error: string | null;
};

export type AuthStateListener = (state: AuthState) => void;

export type AuthStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type AuthClientConfig = {
  baseUrl: string;
  defaultCredentials?: RequestCredentials;
  storageKey?: string;
  storage?: AuthStorage;
  fetcher?: typeof fetch;
  endpoints?: Partial<ActionEndpoints>;
  transformUser?: (payload: unknown) => AuthUser | null;
};

export type AuthApiResponse<T = unknown> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
};
