import type { APIRoute } from 'astro';
import { extractBearerToken, extractCookieToken, verifyToken } from '../../../../lib/auth/jwt';
import { listAuditLogs } from '../../../../lib/db/store';
import { jsonResponse } from '../../../../lib/security/headers';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const token =
    extractBearerToken(request.headers.get('authorization')) ||
    extractCookieToken(request.headers.get('cookie'));

  const user = token ? verifyToken(token) : null;
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return jsonResponse({ success: false, error: 'Unauthorized: insufficient privileges' }, 403);
  }

  try {
    const logs = await listAuditLogs();
    return jsonResponse({ success: true, data: logs });
  } catch (err) {
    return jsonResponse({ success: false, error: 'Failed to retrieve audit logs' }, 500);
  }
};
