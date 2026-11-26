import type { APIRoute } from 'astro';
import { extractBearerToken, extractCookieToken, verifyToken } from '../../../../lib/auth/jwt';
import { findAdminByEmail } from '../../../../lib/db/store';
import { jsonResponse } from '../../../../lib/security/headers';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');

  const token = extractBearerToken(authHeader) || extractCookieToken(cookieHeader);
  if (!token) {
    return jsonResponse({ success: false, error: 'Unauthorized: missing session token' }, 401);
  }

  const payload = verifyToken(token);
  if (!payload) {
    return jsonResponse({ success: false, error: 'Unauthorized: invalid or expired session token' }, 401);
  }

  const admin = await findAdminByEmail(payload.email);
  if (!admin || !admin.isActive) {
    return jsonResponse({ success: false, error: 'User account inactive or removed' }, 401);
  }

  return jsonResponse({
    success: true,
    data: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      lastLoginAt: admin.lastLoginAt,
    },
  });
};
