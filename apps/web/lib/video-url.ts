interface NormalizeVideoUrlOptions {
  protectedMode?: boolean;
}

export function normalizeVideoUrl(
  rawUrl: string | null | undefined,
  options: NormalizeVideoUrlOptions = {},
): string {
  if (!rawUrl) return '';
  const url = rawUrl.trim();
  if (!url) return '';

  const youtubeParams = options.protectedMode
    ? 'rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&fs=0&disablekb=1'
    : 'rel=0';

  const ytWatch = /[?&]v=([\w-]{11})/.exec(url);
  if (ytWatch && /youtube\.com/.test(url)) {
    return `https://www.youtube.com/embed/${ytWatch[1]}?${youtubeParams}`;
  }

  const ytShort = /youtu\.be\/([\w-]{11})/.exec(url);
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}?${youtubeParams}`;

  const ytShorts = /youtube\.com\/shorts\/([\w-]{11})/.exec(url);
  if (ytShorts) return `https://www.youtube.com/embed/${ytShorts[1]}?${youtubeParams}`;

  if (/youtube\.com\/embed\//.test(url)) return appendQuery(url, youtubeParams);

  const driveFile = /drive\.google\.com\/file\/d\/([^/?#]+)/.exec(url);
  if (driveFile) return `https://drive.google.com/file/d/${driveFile[1]}/preview`;

  if (/drive\.google\.com\/file\/.*\/preview/.test(url)) return url;

  const vimeo = /vimeo\.com\/(\d+)/.exec(url);
  if (vimeo) {
    const params = options.protectedMode ? 'dnt=1&title=0&byline=0&portrait=0' : '';
    return `https://player.vimeo.com/video/${vimeo[1]}${params ? `?${params}` : ''}`;
  }

  const loom = /loom\.com\/share\/([\w-]+)/.exec(url);
  if (loom) return `https://www.loom.com/embed/${loom[1]}`;

  return url;
}

export function isDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
}

function appendQuery(url: string, query: string): string {
  if (!query) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${query}`;
}
