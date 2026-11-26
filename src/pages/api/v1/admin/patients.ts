import type { APIRoute } from 'astro';
import { extractBearerToken, extractCookieToken, verifyToken } from '../../../../lib/auth/jwt';
import { listPatients } from '../../../../lib/db/store';
import { jsonResponse } from '../../../../lib/security/headers';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const token =
    extractBearerToken(request.headers.get('authorization')) ||
    extractCookieToken(request.headers.get('cookie'));

  if (!token || !verifyToken(token)) {
    return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const patients = await listPatients();
    return jsonResponse({ success: true, data: patients });
  } catch (err) {
    return jsonResponse({ success: false, error: 'Failed to retrieve patients' }, 500);
  }
};
