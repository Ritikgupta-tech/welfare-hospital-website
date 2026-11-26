import type { APIRoute } from 'astro';
import { extractBearerToken, extractCookieToken, verifyToken } from '../../../../lib/auth/jwt';
import { listNotificationsAdmin } from '../../../../lib/db/store';
import { jsonResponse } from '../../../../lib/security/headers';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const token =
    extractBearerToken(request.headers.get('authorization')) ||
    extractCookieToken(request.headers.get('cookie'));

  const user = token ? verifyToken(token) : null;
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const notifications = await listNotificationsAdmin();
    return jsonResponse({ success: true, data: notifications });
  } catch (err) {
    return jsonResponse({ success: false, error: 'Failed to retrieve notifications' }, 500);
  }
};
