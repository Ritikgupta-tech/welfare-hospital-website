import type { APIRoute } from 'astro';
import { extractBearerToken, extractCookieToken, verifyToken } from '../../../../../lib/auth/jwt';
import { listAppointments } from '../../../../../lib/db/store';
import { jsonResponse } from '../../../../../lib/security/headers';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  const token =
    extractBearerToken(request.headers.get('authorization')) ||
    extractCookieToken(request.headers.get('cookie'));

  if (!token || !verifyToken(token)) {
    return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
  }

  const statusParam = url.searchParams.get('status') || 'ALL';
  const searchParam = url.searchParams.get('search') || '';
  const dateParam = url.searchParams.get('date') || '';
  const pageParam = parseInt(url.searchParams.get('page') || '1', 10);
  const limitParam = parseInt(url.searchParams.get('limit') || '25', 10);

  try {
    const result = await listAppointments({
      status: statusParam as any,
      search: searchParam,
      date: dateParam,
      page: pageParam,
      limit: limitParam,
    });

    return jsonResponse({
      success: true,
      data: result.appointments,
      meta: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  } catch (err) {
    return jsonResponse({ success: false, error: 'Failed to retrieve appointments' }, 500);
  }
};
