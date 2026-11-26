import type { APIRoute } from 'astro';
import { extractBearerToken, extractCookieToken, verifyToken } from '../../../../lib/auth/jwt';
import { getDashboardMetrics } from '../../../../lib/db/store';
import { jsonResponse } from '../../../../lib/security/headers';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const token =
    extractBearerToken(request.headers.get('authorization')) ||
    extractCookieToken(request.headers.get('cookie'));

  if (!token || !verifyToken(token)) {
    return jsonResponse({ success: false, error: 'Unauthorized administrative access' }, 401);
  }

  try {
    const metrics = await getDashboardMetrics();
    return jsonResponse({
      success: true,
      data: metrics,
    });
  } catch (err: any) {
    return jsonResponse({ success: false, error: 'Failed to load dashboard metrics' }, 500);
  }
};
