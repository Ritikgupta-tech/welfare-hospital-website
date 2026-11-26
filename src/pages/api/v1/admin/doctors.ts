import type { APIRoute } from 'astro';
import { extractBearerToken, extractCookieToken, verifyToken } from '../../../../lib/auth/jwt';
import { createDoctor, getAllDoctorsAdmin, updateDoctor } from '../../../../lib/db/store';
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
    const doctors = await getAllDoctorsAdmin();
    return jsonResponse({ success: true, data: doctors });
  } catch (err) {
    return jsonResponse({ success: false, error: 'Failed to retrieve doctors' }, 500);
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
      return jsonResponse({ success: false, error: 'Missing doctor ID' }, 400);
    }

    const updated = await updateDoctor(body.id, body.updates || {});
    if (!updated) {
      return jsonResponse({ success: false, error: 'Doctor not found' }, 404);
    }

    return jsonResponse({ success: true, data: updated });
  } catch (err) {
    return jsonResponse({ success: false, error: 'Failed to update doctor' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const token =
    extractBearerToken(request.headers.get('authorization')) ||
    extractCookieToken(request.headers.get('cookie'));

  const user = token ? verifyToken(token) : null;
  if (!user || user.role !== 'SUPER_ADMIN') {
    return jsonResponse({ success: false, error: 'Forbidden: Super Admin required' }, 403);
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.name || !body.title || !body.department || !body.qualifications || !body.opdTimings) {
      return jsonResponse({ success: false, error: 'Missing required doctor fields' }, 400);
    }

    const doc = await createDoctor({
      name: body.name.trim(),
      title: body.title.trim(),
      department: body.department.trim(),
      qualifications: body.qualifications.trim(),
      experienceYears: body.experienceYears ? Number(body.experienceYears) : 5,
      opdTimings: body.opdTimings.trim(),
      isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : true,
    });

    return jsonResponse({ success: true, data: doc }, 201);
  } catch (err) {
    return jsonResponse({ success: false, error: 'Failed to create doctor' }, 500);
  }
};
