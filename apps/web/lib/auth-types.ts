import type { UserRole } from '@mkt-academy/types';

// Kiểu dữ liệu user trả về từ /auth/me (khớp với MeResult bên API).
export interface MeResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  department: { id: string; name: string } | null;
  profile: {
    avatar: string | null;
    exp: number;
    streakCount: number;
    stage: string;
    rank: number | null;
    level: { id: string; order: number; name: string; expThreshold: number } | null;
  } | null;
  needsCharacterSetup: boolean;
}

export interface LoginApiResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    departmentId: string | null;
  };
}
