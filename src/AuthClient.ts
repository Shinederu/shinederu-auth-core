import { EMPTY_SESSION, defaultTransformUser, mergeEndpoints, toQueryString } from "./helpers.js";
import { createBrowserStorage } from "./storage.js";
import {
  AuthApiResponse,
  AuthClientConfig,
  AuthCredentials,
  AuthRegisterPayload,
  AuthRequestConfig,
  AuthSession,
  AuthState,
  AuthStateListener,
  AuthUser,
  FetchLike,
  HttpMethod,
} from "./types.js";

const DEFAULT_STORAGE_KEY = "shinederu_auth_session";

const parseResponseData = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return null;

  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const getErrorMessage = (data: unknown, fallback: string): string => {
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (typeof record.error === "string") return record.error;
    if (typeof record.message === "string") return record.message;
  }

  return fallback;
};

const getGlobalFetcher = (): FetchLike | null => {
  if (typeof globalThis === "undefined") return null;
  if (typeof globalThis.fetch !== "function") return null;

  return globalThis.fetch.bind(globalThis);
};

export class AuthClient {
  private readonly baseUrl: string;
  private readonly storageKey: string;
  private readonly defaultCredentials: RequestCredentials;
  private readonly storage;
  private readonly fetcher: FetchLike | null;
  private readonly endpoints;
  private readonly transformUser;

  private state: AuthState = {
    session: EMPTY_SESSION,
    isLoading: false,
    error: null,
  };

  private listeners = new Set<AuthStateListener>();

  public constructor(config: AuthClientConfig) {
    this.baseUrl = config.baseUrl;
    this.storageKey = config.storageKey ?? DEFAULT_STORAGE_KEY;
    this.defaultCredentials = config.defaultCredentials ?? "include";
    this.storage = config.storage ?? createBrowserStorage();
    this.fetcher = config.fetcher ?? getGlobalFetcher();
    this.endpoints = mergeEndpoints(config.endpoints);
    this.transformUser = config.transformUser ?? defaultTransformUser;

    this.restoreSession();
  }

  public getState(): AuthState {
    return this.state;
  }

  public getSession(): AuthSession {
    return this.state.session;
  }

  public subscribe(listener: AuthStateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public restoreSession(): AuthSession {
    const raw = this.storage.getItem(this.storageKey);
    if (!raw) {
      this.updateState({ session: EMPTY_SESSION });
      return EMPTY_SESSION;
    }

    try {
      const parsed = JSON.parse(raw) as AuthSession;
      const session: AuthSession = {
        isAuthenticated: Boolean(parsed?.isAuthenticated),
        user: parsed?.user ?? null,
        updatedAt: parsed?.updatedAt ?? Date.now(),
      };
      this.updateState({ session });
      return session;
    } catch {
      this.storage.removeItem(this.storageKey);
      this.updateState({ session: EMPTY_SESSION });
      return EMPTY_SESSION;
    }
  }

  public clearSession(): void {
    this.storage.removeItem(this.storageKey);
    this.updateState({ session: { ...EMPTY_SESSION, updatedAt: Date.now() } });
  }

  public async login(credentials: AuthCredentials): Promise<AuthApiResponse> {
    const response = await this.invokeAction("POST", "login", credentials);

    if (response.ok) {
      const user = this.transformUser(response.data);
      if (user) this.setSession(user);
    }

    return response;
  }

  public async register(payload: AuthRegisterPayload): Promise<AuthApiResponse> {
    return this.invokeAction("POST", "register", payload);
  }

  public async me(): Promise<AuthApiResponse<AuthUser>> {
    const response = await this.invokeAction("GET", "me");
    const user = this.transformUser(response.data);

    if (response.ok && user) {
      this.setSession(user);
      return { ...response, data: user };
    }

    if (!response.ok) {
      this.clearSession();
    }

    return { ...response, data: user };
  }

  public async logout(): Promise<AuthApiResponse> {
    const response = await this.invokeAction("POST", "logout");
    this.clearSession();
    return response;
  }

  public async logoutAll(): Promise<AuthApiResponse> {
    const response = await this.invokeAction("POST", "logoutAll");
    this.clearSession();
    return response;
  }

  public async requestPasswordReset(email: string): Promise<AuthApiResponse> {
    return this.invokeAction("POST", "requestPasswordReset", { email });
  }

  public async resetPassword(token: string, password: string, passwordConfirm: string): Promise<AuthApiResponse> {
    return this.invokeAction("PUT", "resetPassword", {
      token,
      password,
      passwordConfirm,
    });
  }

  public async requestEmailUpdate(email: string, emailConfirm: string): Promise<AuthApiResponse> {
    return this.invokeAction("PUT", "requestEmailUpdate", { email, emailConfirm });
  }

  public async confirmEmailUpdate(token: string): Promise<AuthApiResponse> {
    return this.invokeAction("POST", "confirmEmailUpdate", { token });
  }

  public async verifyEmail(token: string): Promise<AuthApiResponse> {
    return this.invokeAction("POST", "verifyEmail", { token });
  }

  public async revokeRegister(token: string): Promise<AuthApiResponse> {
    return this.invokeAction("POST", "revokeRegister", { token });
  }

  public async revokeEmailUpdate(token: string): Promise<AuthApiResponse> {
    return this.invokeAction("POST", "revokeEmailUpdate", { token });
  }

  public async updateProfile(username: string): Promise<AuthApiResponse> {
    return this.invokeAction("POST", "updateProfile", { username });
  }

  public async updateAvatar(file: File | Blob, fileName = "avatar.png"): Promise<AuthApiResponse> {
    const fd = new FormData();
    fd.append("file", file, fileName);

    return this.invokeAction("POST", "updateAvatar", fd);
  }

  public async deleteAccount(password: string): Promise<AuthApiResponse> {
    const response = await this.invokeAction("DELETE", "deleteAccount", { password });
    if (response.ok) {
      this.clearSession();
    }
    return response;
  }

  public async invoke(method: HttpMethod, action: string, payload?: Record<string, unknown> | FormData): Promise<AuthApiResponse> {
    return this.request({ method, payload: payload ?? null }, action);
  }

  private setSession(user: AuthUser): void {
    const session: AuthSession = {
      isAuthenticated: true,
      user,
      updatedAt: Date.now(),
    };

    this.storage.setItem(this.storageKey, JSON.stringify(session));
    this.updateState({ session });
  }

  private async invokeAction(
    method: HttpMethod,
    actionKey: keyof ReturnType<typeof mergeEndpoints>,
    payload?: Record<string, unknown> | FormData
  ): Promise<AuthApiResponse> {
    return this.request({ method, payload: payload ?? null }, actionKey);
  }

  private async request(config: AuthRequestConfig, actionOrPath: string): Promise<AuthApiResponse> {
    this.updateState({ isLoading: true, error: null });

    if (!this.fetcher) {
      const message = "No fetch implementation available. Provide `fetcher` in AuthClientConfig.";
      this.updateState({ isLoading: false, error: message });
      return {
        ok: false,
        status: 0,
        data: null,
        error: message,
      };
    }

    const endpoint = this.endpoints[actionOrPath as keyof typeof this.endpoints] ?? "";
    const targetUrl = endpoint ? `${this.baseUrl}${endpoint}` : this.baseUrl;

    const method = config.method ?? "GET";
    let url = targetUrl;
    let body: BodyInit | null = null;

    if (config.payload instanceof FormData) {
      config.payload.append("action", actionOrPath);
      body = config.payload;
    } else {
      const payload: Record<string, unknown> = {
        action: actionOrPath,
        ...(config.payload ?? {}),
      };

      if (method === "GET" || method === "DELETE") {
        const query = toQueryString(payload);
        url = query ? `${targetUrl}${targetUrl.includes("?") ? "&" : "?"}${query}` : targetUrl;
      } else {
        body = JSON.stringify(payload);
      }
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(config.headers ?? {}),
    };

    if (body && !(body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await this.fetcher(url, {
        method,
        body: method === "GET" || method === "DELETE" ? null : body,
        credentials: config.credentials ?? this.defaultCredentials,
        headers,
        signal: config.signal,
      });

      const data = await parseResponseData(response);

      if (!response.ok) {
        const errorMessage = getErrorMessage(data, response.statusText || "Request failed");
        this.updateState({ isLoading: false, error: errorMessage });
        return {
          ok: false,
          status: response.status,
          data,
          error: errorMessage,
        };
      }

      this.updateState({ isLoading: false, error: null });
      return {
        ok: true,
        status: response.status,
        data,
        error: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown network error";
      this.updateState({ isLoading: false, error: message });
      return {
        ok: false,
        status: 0,
        data: null,
        error: message,
      };
    }
  }

  private updateState(partial: Partial<AuthState>): void {
    this.state = {
      ...this.state,
      ...partial,
    };

    this.listeners.forEach((listener) => listener(this.state));
  }
}

export const createAuthClient = (config: AuthClientConfig): AuthClient => new AuthClient(config);
