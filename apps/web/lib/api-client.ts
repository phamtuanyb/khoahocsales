// Fetch client có tự refresh token khi gặp 401.
// Mọi component frontend gọi API qua đây để xử lý xác thực thống nhất.

import { apiUrl } from './env';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './auth-store';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  // Khi true: không tự thêm Authorization (dùng cho login/refresh).
  skipAuth?: boolean;
  // Khi true: không thử refresh nếu 401 (tránh vòng lặp).
  skipRetry?: boolean;
}

// Hứa refresh chung — tránh gửi nhiều request refresh song song khi access hết hạn.
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  refreshPromise = (async () => {
    try {
      const response = await fetch(apiUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // credentials:include để browser gửi cookie refresh httpOnly.
        // Body refreshToken vẫn gửi để backward-compat khi cookie chưa set.
        credentials: 'include',
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) {
        clearTokens();
        return false;
      }
      const data = (await response.json()) as {
        accessToken: string;
        refreshToken: string;
      };
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function rawRequest<T>(path: string, options: ApiOptions): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!options.skipAuth) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
    // Gửi/nhận cookie httpOnly (refresh) — risk #1.
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  // 401 → thử refresh đúng một lần rồi retry request gốc.
  if (response.status === 401 && !options.skipAuth && !options.skipRetry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return rawRequest<T>(path, { ...options, skipRetry: true });
    }
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => undefined)
    : await response.text().catch(() => undefined);

  if (!response.ok) {
    const message = extractErrorMessage(payload) ?? `Lỗi ${response.status}`;
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}

function extractErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const obj = payload as { message?: unknown };
  if (typeof obj.message === 'string') return obj.message;
  if (Array.isArray(obj.message) && obj.message.length > 0) {
    return obj.message.map((m) => String(m)).join('; ');
  }
  return undefined;
}

export const api = {
  get: <T>(path: string, options: ApiOptions = {}) =>
    rawRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options: ApiOptions = {}) =>
    rawRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options: ApiOptions = {}) =>
    rawRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options: ApiOptions = {}) =>
    rawRequest<T>(path, { ...options, method: 'DELETE' }),
};
