import type { APIRoute } from 'astro';
import { jsonResponse } from '../../../../lib/security/headers';

export const prerender = false;

export const POST: APIRoute = async () => {
  const expiredCookie = `welfare_admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  return jsonResponse(
    {
      success: true,
      message: 'Successfully logged out',
    },
    200,
    { 'Set-Cookie': expiredCookie }
  );
};
