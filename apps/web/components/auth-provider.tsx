'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@mkt-academy/types';
import { api, ApiError } from '@/lib/api-client';
import {
  clearTokens,
  getAccessToken,
  setTokens,
} from '@/lib/auth-store';
import type { LoginApiResponse, MeResponse } from '@/lib/auth-types';

interface AuthContextValue {
  user: MeResponse | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<MeResponse>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<MeResponse | null>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const router = useRouter();
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async (): Promise<MeResponse | null> => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return null;
    }
    try {
      const me = await api.get<MeResponse>('/auth/me');
      setUser(me);
      return me;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearTokens();
        setUser(null);
      }
      return null;
    }
  }, []);

  // Khởi động: thử load /auth/me nếu có token sẵn.
  useEffect(() => {
    let mounted = true;
    (async () => {
      await refreshMe();
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [refreshMe]);

  const login = useCallback(
    async (email: string, password: string): Promise<MeResponse> => {
      const result = await api.post<LoginApiResponse>('/auth/login', { email, password }, {
        skipAuth: true,
      });
      setTokens(result.accessToken, result.refreshToken);
      const me = await api.get<MeResponse>('/auth/me');
      setUser(me);
      return me;
    },
    [],
  );

  const logout = useCallback(async () => {
    // Gọi backend xóa cookie httpOnly refresh — risk #1.
    try {
      await api.post('/auth/logout', undefined, { skipAuth: true });
    } catch {
      /* ignore lỗi mạng — vẫn clear local */
    }
    clearTokens();
    setUser(null);
    router.replace('/login');
  }, [router]);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout, refreshMe, hasRole }),
    [user, loading, login, logout, refreshMe, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  }
  return ctx;
}
