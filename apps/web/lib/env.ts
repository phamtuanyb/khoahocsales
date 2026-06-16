// Runtime env helper cho frontend.
// Ho tro ca 2 kieu:
// - NEXT_PUBLIC_API_URL=https://domain
// - NEXT_PUBLIC_API_URL=https://domain/api

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const normalizedApiBase = API_BASE_URL.replace(/\/+$/, '');
export const API_PREFIX = normalizedApiBase.endsWith('/api') ? '/v1' : '/api/v1';

export const apiUrl = (path: string): string => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${API_PREFIX}${normalized}`;
};
