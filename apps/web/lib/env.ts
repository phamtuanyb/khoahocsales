// Đọc cấu hình runtime từ NEXT_PUBLIC_* — fallback an toàn cho dev local.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? '';

export const API_PREFIX = '/api/v1';

export const apiUrl = (path: string): string => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${API_PREFIX}${normalized}`;
};
