import { readFile } from 'node:fs/promises';
import { join, normalize, sep } from 'node:path';
import { cwd } from 'node:process';

import 'zone.js';
import 'zone.js/testing';

/**
 * The `@angular/build:unit-test` builder runs tests in a Node.js environment
 * with jsdom instead of a real browser (Karma), so there is no HTTP server.
 * Relative fetches used by tests (e.g. `/data/...` or `/assets/...` fixtures
 * from `public/`) are served from disk here, mirroring the Karma web server.
 */
const PUBLIC_ROOT = join(cwd(), 'public');

const originalFetch = globalThis.fetch;

globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(rawUrl, 'http://localhost').pathname);
  } catch {
    return originalFetch(input, init);
  }

  if (!pathname.startsWith('/data/') && !pathname.startsWith('/assets/')) {
    return originalFetch(input, init);
  }

  try {
    const filePath = normalize(join(PUBLIC_ROOT, pathname));
    if (!filePath.startsWith(`${PUBLIC_ROOT}${sep}`)) {
      return new Response('Forbidden', { status: 403 });
    }
    return new Response(await readFile(filePath), { status: 200 });
  } catch {
    return new Response('Not Found', { status: 404 });
  }
};
