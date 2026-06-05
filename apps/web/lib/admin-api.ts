import { api, ApiError } from './api-client';
import { apiUrl } from './env';
import { getAccessToken } from './auth-store';

// Kiểu chung — admin trả về các entity Prisma raw. FE không cần khắt khe kiểu.
export type AdminCourse = {
  id: string;
  title: string;
  description: string | null;
  departmentId: string;
  department: { id: string; name: string };
  order: number;
  unlockRule: Record<string, unknown> | null;
  isPublished: boolean;
  _count?: { modules: number };
  modules?: AdminModule[];
};

export type AdminModule = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  order: number;
  unlockRule: Record<string, unknown> | null;
  lessons?: Array<{ id: string; title: string; order: number; videoUrl: string | null }>;
  quizzes?: Array<{ id: string; title: string }>;
  _count?: { lessons: number; questions: number };
};

export type AdminLesson = {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  videoUrl: string | null;
  order: number;
};

export type AdminDepartment = {
  id: string;
  name: string;
  _count?: { users: number; courses: number };
};

export type AdminQuestion = {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'SITUATION' | 'MINI_GAME' | 'BOSS_BATTLE';
  content: string;
  options: unknown;
  answer: Record<string, unknown>;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  moduleId: string | null;
  isActive: boolean;
  module?: { id: string; title: string; courseId: string } | null;
};

export type AdminQuiz = {
  id: string;
  title: string;
  description: string | null;
  moduleId: string | null;
  levelId: string | null;
  passScore: number;
  timeLimitSec: number;
  maxAttempts: number;
  isActive: boolean;
  module?: { id: string; title: string; courseId: string } | null;
  level?: { id: string; name: string; order: number } | null;
  questions?: Array<{ order: number; question: AdminQuestion }>;
  _count?: { questions: number; attempts: number };
};

export type AdminLevel = {
  id: string;
  order: number;
  name: string;
  expThreshold: number;
  description: string | null;
  _count?: { profiles: number };
};

export type AdminExpRule = {
  id: string;
  action: string;
  amount: number;
  enabled: boolean;
  description: string | null;
  defaultAmount: number;
};

export type AdminBadge = {
  id: string;
  name: string;
  icon: string;
  description: string;
  rule: Record<string, unknown>;
  isActive: boolean;
  _count?: { userBadges: number };
};

export type AdminMission = {
  id: string;
  title: string;
  description: string | null;
  rewardExp: number;
  rule: Record<string, unknown>;
  isDaily: boolean;
  isActive: boolean;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: 'LEARNER' | 'MANAGER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  departmentId: string | null;
  department: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminOverview = {
  totals: {
    users: number;
    activeToday: number;
    activeThisWeek: number;
    courses: number;
    questions: number;
    quizzes: number;
    badgesAwarded: number;
    certificatesIssued: number;
  };
  levelDistribution: Array<{ levelId: string; order: number; name: string; count: number }>;
  topPerformers: Array<{
    userId: string;
    name: string;
    email: string;
    department: string | null;
    levelOrder: number;
    levelName: string | null;
    exp: number;
  }>;
  inactiveUsers: Array<{
    userId: string;
    name: string;
    email: string;
    department: string | null;
    lastActiveAt: string | null;
    daysSinceActive: number | null;
  }>;
  courseProgress: Array<{
    courseId: string;
    title: string;
    department: string | null;
    totalLessons: number;
    totalUsers: number;
    avgCompletionPercent: number;
  }>;
  quizPassRates: Array<{
    quizId: string;
    title: string;
    totalAttempts: number;
    passedAttempts: number;
    passRate: number;
    avgScore: number;
  }>;
};

export const adminApi = {
  // Departments
  listDepartments: () => api.get<AdminDepartment[]>('/admin/departments'),
  createDepartment: (name: string) => api.post<AdminDepartment>('/admin/departments', { name }),
  updateDepartment: (id: string, name: string) =>
    api.patch<AdminDepartment>(`/admin/departments/${id}`, { name }),
  deleteDepartment: (id: string) => api.delete<{ ok: boolean }>(`/admin/departments/${id}`),

  // Courses
  listCourses: () => api.get<AdminCourse[]>('/admin/courses'),
  getCourse: (id: string) => api.get<AdminCourse>(`/admin/courses/${id}`),
  createCourse: (data: Partial<AdminCourse>) =>
    api.post<AdminCourse>('/admin/courses', data),
  updateCourse: (id: string, data: Partial<AdminCourse>) =>
    api.patch<AdminCourse>(`/admin/courses/${id}`, data),
  deleteCourse: (id: string) => api.delete<{ ok: boolean }>(`/admin/courses/${id}`),

  // Modules
  createModule: (data: Partial<AdminModule>) =>
    api.post<AdminModule>('/admin/modules', data),
  updateModule: (id: string, data: Partial<AdminModule>) =>
    api.patch<AdminModule>(`/admin/modules/${id}`, data),
  deleteModule: (id: string) => api.delete<{ ok: boolean }>(`/admin/modules/${id}`),

  // Lessons
  getLesson: (id: string) => api.get<AdminLesson>(`/admin/lessons/${id}`),
  createLesson: (data: Partial<AdminLesson>) =>
    api.post<AdminLesson>('/admin/lessons', data),
  updateLesson: (id: string, data: Partial<AdminLesson>) =>
    api.patch<AdminLesson>(`/admin/lessons/${id}`, data),
  deleteLesson: (id: string) => api.delete<{ ok: boolean }>(`/admin/lessons/${id}`),

  // Questions
  listQuestions: (params?: { type?: string; moduleId?: string; q?: string }) => {
    const sp = new URLSearchParams();
    if (params?.type) sp.set('type', params.type);
    if (params?.moduleId) sp.set('moduleId', params.moduleId);
    if (params?.q) sp.set('q', params.q);
    return api.get<AdminQuestion[]>(`/admin/questions${sp.toString() ? `?${sp}` : ''}`);
  },
  getQuestion: (id: string) => api.get<AdminQuestion>(`/admin/questions/${id}`),
  createQuestion: (data: Partial<AdminQuestion>) =>
    api.post<AdminQuestion>('/admin/questions', data),
  updateQuestion: (id: string, data: Partial<AdminQuestion>) =>
    api.patch<AdminQuestion>(`/admin/questions/${id}`, data),
  deleteQuestion: (id: string) => api.delete<{ ok: boolean }>(`/admin/questions/${id}`),

  // Quizzes
  listQuizzes: (params?: { moduleId?: string; levelId?: string }) => {
    const sp = new URLSearchParams();
    if (params?.moduleId) sp.set('moduleId', params.moduleId);
    if (params?.levelId) sp.set('levelId', params.levelId);
    return api.get<AdminQuiz[]>(`/admin/quizzes${sp.toString() ? `?${sp}` : ''}`);
  },
  getQuiz: (id: string) => api.get<AdminQuiz>(`/admin/quizzes/${id}`),
  createQuiz: (data: Partial<AdminQuiz> & { questionIds: string[] }) =>
    api.post<AdminQuiz>('/admin/quizzes', data),
  updateQuiz: (id: string, data: Partial<AdminQuiz> & { questionIds?: string[] }) =>
    api.patch<AdminQuiz>(`/admin/quizzes/${id}`, data),
  deleteQuiz: (id: string) => api.delete<{ ok: boolean }>(`/admin/quizzes/${id}`),

  // Levels
  listLevels: () => api.get<AdminLevel[]>('/admin/levels'),
  createLevel: (data: Partial<AdminLevel>) => api.post<AdminLevel>('/admin/levels', data),
  updateLevel: (id: string, data: Partial<AdminLevel>) =>
    api.patch<AdminLevel>(`/admin/levels/${id}`, data),
  deleteLevel: (id: string) => api.delete<{ ok: boolean }>(`/admin/levels/${id}`),

  // EXP rules
  listExpRules: () => api.get<AdminExpRule[]>('/admin/exp-rules'),
  updateExpRule: (action: string, data: { amount?: number; enabled?: boolean; description?: string }) =>
    api.patch<AdminExpRule>(`/admin/exp-rules/${action}`, data),

  // Badges
  listBadges: () => api.get<AdminBadge[]>('/admin/badges'),
  createBadge: (data: Partial<AdminBadge>) => api.post<AdminBadge>('/admin/badges', data),
  updateBadge: (id: string, data: Partial<AdminBadge>) =>
    api.patch<AdminBadge>(`/admin/badges/${id}`, data),
  deleteBadge: (id: string) => api.delete<{ ok: boolean }>(`/admin/badges/${id}`),

  // Missions
  listMissions: () => api.get<AdminMission[]>('/admin/missions'),
  createMission: (data: Partial<AdminMission>) =>
    api.post<AdminMission>('/admin/missions', data),
  updateMission: (id: string, data: Partial<AdminMission>) =>
    api.patch<AdminMission>(`/admin/missions/${id}`, data),
  deleteMission: (id: string) => api.delete<{ ok: boolean }>(`/admin/missions/${id}`),

  // Users (extend existing /users with admin actions) — paginated.
  listUsers: (params?: { departmentId?: string; q?: string; page?: number; pageSize?: number }) => {
    const sp = new URLSearchParams();
    if (params?.departmentId) sp.set('departmentId', params.departmentId);
    if (params?.q) sp.set('q', params.q);
    if (params?.page) sp.set('page', String(params.page));
    if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
    return api.get<{
      data: AdminUser[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/users${sp.toString() ? `?${sp}` : ''}`);
  },
  getUser: (id: string) => api.get<AdminUser>(`/users/${id}`),
  createUser: (data: { email: string; name: string; password: string; role: string; departmentId?: string }) =>
    api.post<AdminUser>('/users', data),
  updateUser: (id: string, data: Partial<AdminUser> & { password?: string }) =>
    api.patch<AdminUser>(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete<{ id: string; status: string }>(`/users/${id}`),
  adjustExp: (id: string, amount: number, reason: string) =>
    api.post<{ ok: boolean; totalExp: number; note: string }>(
      `/admin/users/${id}/adjust-exp`,
      { amount, reason },
    ),
  forceUnlock: (
    id: string,
    targetType: 'LESSON' | 'MODULE' | 'COURSE' | 'LEVEL',
    targetId: string,
    reason: string,
  ) =>
    api.post<{ ok: boolean; note: string }>(`/admin/users/${id}/force-unlock`, {
      targetType,
      targetId,
      reason,
    }),

  // Analytics
  overview: () => api.get<AdminOverview>('/admin/analytics/overview'),
};

// Download Excel — fetch raw response và trigger download (api-client trả JSON nên dùng fetch riêng).
export async function downloadExcel(path: string, filename: string): Promise<void> {
  const token = getAccessToken();
  const res = await fetch(apiUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text || `Lỗi ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Upload file generic — multipart/form-data. Dùng cho Excel import + video/image.
export async function uploadFile<T>(path: string, file: File): Promise<T> {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include',
    body: formData,
  });
  const contentType = res.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await res.json().catch(() => undefined)
    : await res.text().catch(() => undefined);
  if (!res.ok) {
    const message = extractErrorMessage(payload) ?? `Lỗi ${res.status}`;
    throw new ApiError(res.status, message, payload);
  }
  return payload as T;
}

// Alias cũ — giữ tương thích ngược (UsersImportModal đang dùng).
export const uploadExcel = uploadFile;

function extractErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const obj = payload as { message?: unknown };
  if (typeof obj.message === 'string') return obj.message;
  if (Array.isArray(obj.message) && obj.message.length > 0) {
    return obj.message.map((m) => String(m)).join('; ');
  }
  return undefined;
}
