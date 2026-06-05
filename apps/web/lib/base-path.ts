const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const BASE_PATH =
  rawBasePath && rawBasePath !== '/' ? rawBasePath.replace(/\/+$/, '') : '';

export function withBasePath(path: string): string {
  if (!path) return BASE_PATH || '/';
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}${normalized}`;
}
