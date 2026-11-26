import type { APIRoute } from 'astro';
import { extractBearerToken, extractCookieToken, verifyToken } from '../../../../lib/auth/jwt';
import { createService, getAllServicesAdmin, updateService } from '../../../../lib/db/store';
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
    const services = await getAllServicesAdmin();
    return jsonResponse({ success: true, data: services });
  } catch (err) {
    return jsonResponse({ success: false, error: 'Failed to retrieve services' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const token =
    extractBearerToken(request.headers.get('authorization')) ||
    extractCookieToken(request.headers.get('cookie'));

  const user = token ? verifyToken(token) : null;
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return jsonResponse({ success: false, error: 'Forbidden' }, 403);
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.name || !body.category || !body.shortDesc || !body.fullDesc) {
      return jsonResponse({ success: false, error: 'Missing required service fields' }, 400);
    }

    const service = await createService({
      name: body.name.trim(),
      category: body.category.trim(),
      shortDesc: body.shortDesc.trim(),
      fullDesc: body.fullDesc.trim(),
      iconName: body.iconName,
      isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : true,
    });

    return jsonResponse({ success: true, data: service }, 201);
  } catch (err) {
    return jsonResponse({ success: false, error: 'Failed to create service' }, 500);
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  const token =
    extractBearerToken(request.headers.get('authorization')) ||
    extractCookieToken(request.headers.get('cookie'));

  const user = token ? verifyToken(token) : null;
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return jsonResponse({ success: false, error: 'Forbidden' }, 403);
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.id) {
      return jsonResponse({ success: false, error: 'Missing service ID' }, 400);
    }

    const updated = await updateService(body.id, body.updates || {});
    if (!updated) {
      return jsonResponse({ success: false, error: 'Service not found' }, 404);
    }

    return jsonResponse({ success: true, data: updated });
  } catch (err) {
    return jsonResponse({ success: false, error: 'Failed to update service' }, 500);
  }
};
