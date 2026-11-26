import type { APIRoute } from 'astro';
import { extractBearerToken, extractCookieToken, verifyToken } from '../../../../lib/auth/jwt';
import { findAdminByEmail, updateAdminPassword } from '../../../../lib/db/store';
import { hashPassword, verifyPassword } from '../../../../lib/auth/password';
import { jsonResponse } from '../../../../lib/security/headers';
import { checkRateLimit, getClientIp } from '../../../../lib/security/rateLimit';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const clientIp = getClientIp(request);
  // Rate limit: 5 password change attempts per 15 minutes
  const rateLimit = checkRateLimit(`pwd_change_${clientIp}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return jsonResponse(
      { success: false, error: 'Too many password change attempts. Please try again later.' },
      429
    );
  }

  const token =
    extractBearerToken(request.headers.get('authorization')) ||
    extractCookieToken(request.headers.get('cookie'));

  const user = token ? verifyToken(token) : null;
  if (!user) {
    return jsonResponse({ success: false, error: 'Unauthorized: active session required' }, 401);
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.currentPassword || !body.newPassword) {
      return jsonResponse({ success: false, error: 'Both current password and new password are required' }, 400);
    }

    const { currentPassword, newPassword } = body;

    // Password complexity check
    if (newPassword.length < 10) {
      return jsonResponse({ success: false, error: 'New password must be at least 10 characters long' }, 400);
    }
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNum = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNum || !hasSpecial) {
      return jsonResponse(
        {
          success: false,
          error: 'New password must contain uppercase, lowercase, number, and special character',
        },
        400
      );
    }

    const admin = await findAdminByEmail(user.email);
    if (!admin) {
      return jsonResponse({ success: false, error: 'Administrator record not found' }, 404);
    }

    const isCurrentValid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!isCurrentValid) {
      return jsonResponse({ success: false, error: 'Current password does not match' }, 401);
    }

    // Hash new password with bcrypt
    const newHash = await hashPassword(newPassword);
    await updateAdminPassword(admin.id, newHash);

    // Invalidate old session cookie
    const expiredCookie = `welfare_admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;

    return jsonResponse(
      {
        success: true,
        message: 'Password rotated successfully. Please log in with your new credentials.',
      },
      200,
      { 'Set-Cookie': expiredCookie }
    );
  } catch (err: any) {
    console.error('[Auth] Password change error:', err);
    return jsonResponse({ success: false, error: 'Internal server error during password rotation' }, 500);
  }
};
