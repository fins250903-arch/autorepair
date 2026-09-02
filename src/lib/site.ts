export const SITE_URL = 'https://autorepair.abura.site';

export const STORE_NAME = '三河フロントウインドウリペア出張専門店';

export const TEL = '070-8428-0866';
export const TEL_LINK = 'tel:07084280866';
export const LINE_URL = 'https://lin.ee/Qvq5293';

export function canonicalUrl(path: string): string {
  let pathname = path.trim();
  if (!pathname) pathname = '/';

  if (pathname.startsWith('http://') || pathname.startsWith('https://')) {
    try {
      pathname = new URL(pathname).pathname;
    } catch {
      pathname = '/';
    }
  }

  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  pathname = pathname.replace(/\/{2,}/g, '/');
  pathname = pathname.replace(/\/+$/, '') || '';

  return `${SITE_URL}${pathname === '' ? '/' : pathname}`;
}
