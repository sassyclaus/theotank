const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export class ApiError extends Error {
  status: number;
  code: string | null;
  data: Record<string, unknown>;

  constructor(status: number, body: Record<string, unknown>) {
    const message = (body.error as string) || `Request failed: ${status}`;
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = (body.code as string) ?? null;
    this.data = body;
  }
}

class ApiClient {
  private getToken: (() => Promise<string | null>) | null = null;
  private signOutHandler: (() => void) | null = null;

  setTokenGetter(getter: () => Promise<string | null>) {
    this.getToken = getter;
  }

  setSignOutHandler(handler: () => void) {
    this.signOutHandler = handler;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const { body, headers: customHeaders, ...rest } = options;

    const headers = await this.buildHeaders(customHeaders);
    const hadToken = !!headers["Authorization"];

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...rest,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      if (response.status === 401 && hadToken && this.signOutHandler) {
        this.signOutHandler();
      }
      // Try to parse JSON error body
      let errorBody: Record<string, unknown> = {};
      try {
        errorBody = await response.json();
      } catch {
        const text = await response.text();
        errorBody = { error: text || `Request failed: ${response.statusText}` };
      }
      throw new ApiError(response.status, errorBody);
    }

    if (
      response.status === 204 ||
      response.headers.get("content-length") === "0"
    ) {
      return undefined as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: "POST", body });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: "PUT", body });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: "PATCH", body });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  private async buildHeaders(
    customHeaders?: HeadersInit,
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(customHeaders as Record<string, string>),
    };

    if (this.getToken) {
      const token = await this.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }
}

export const apiClient = new ApiClient();
