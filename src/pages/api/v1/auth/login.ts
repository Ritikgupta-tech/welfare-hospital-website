import type { APIRoute } from 'astro';
import { findAdminByEmail, updateAdminLastLogin } from '../../../../lib/db/store';
import { verifyPassword } from '../../../../lib/auth/password';
import { signToken } from '../../../../lib/auth/jwt';
import { checkRateLimit, getClientIp } from '../../../../lib/security/rateLimit';
import { jsonResponse } from '../../../../lib/security/headers';
import { loginSchema } from '../../../../lib/validation/schemas';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const clientIp = getClientIp(request);
  // Strict login brute-force rate limit: 5 attempts per 15 minutes
  const rateLimit = checkRateLimit(`auth_login_${clientIp}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return jsonResponse(
      {
        success: false,
        error: `Too many failed login attempts. Account protected. Please try again in ${Math.ceil(
          rateLimit.resetInSec / 60
        )} minutes.`,
      },
      429
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return jsonResponse({ success: false, error: 'Invalid email or password format' }, 400);
    }

    const { email, password } = validation.data;
    const admin = await findAdminByEmail(email);

    if (!admin || !admin.isActive) {
      return jsonResponse({ success: false, error: 'Invalid administrative credentials' }, 401);
    }

    const validPassword = await verifyPassword(password, admin.passwordHash);
    if (!validPassword) {
      return jsonResponse({ success: false, error: 'Invalid administrative credentials' }, 401);
    }

    // Update last login
    await updateAdminLastLogin(admin.id);

    // Generate JWT
    const token = signToken({
      userId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    const cookieVal = `welfare_admin_token=${encodeURIComponent(
      token
    )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${8 * 3600}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;

    return jsonResponse(
      {
        success: true,
        message: 'Authentication successful',
        data: {
          token,
          user: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
          },
        },
      },
      200,
      { 'Set-Cookie': cookieVal }
    );
  } catch (err: any) {
    console.error('[Auth] Login error:', err);
    return jsonResponse({ success: false, error: 'Internal error during authentication' }, 500);
  }
};
