import type { APIRoute } from 'astro';
import { extractBearerToken, extractCookieToken, verifyToken } from '../../../../../lib/auth/jwt';
import { getAppointmentById, updateAppointmentStatus } from '../../../../../lib/db/store';
import { generateAppointmentStatusUpdateEmail, sendEmailNotification } from '../../../../../lib/notifications/email';
import { jsonResponse } from '../../../../../lib/security/headers';
import { updateAppointmentStatusSchema } from '../../../../../lib/validation/schemas';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const token =
    extractBearerToken(request.headers.get('authorization')) ||
    extractCookieToken(request.headers.get('cookie'));

  if (!token || !verifyToken(token)) {
    return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
  }

  const id = params.id;
  if (!id) return jsonResponse({ success: false, error: 'Missing appointment ID' }, 400);

  const appointment = await getAppointmentById(id);
  if (!appointment) return jsonResponse({ success: false, error: 'Appointment not found' }, 404);

  return jsonResponse({ success: true, data: appointment });
};

export const PATCH: APIRoute = async ({ params, request }) => {
  const token =
    extractBearerToken(request.headers.get('authorization')) ||
    extractCookieToken(request.headers.get('cookie'));

  const user = token ? verifyToken(token) : null;
  if (!user) {
    return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
  }

  const id = params.id;
  if (!id) return jsonResponse({ success: false, error: 'Missing appointment ID' }, 400);

  try {
    const body = await request.json().catch(() => null);
    const validation = updateAppointmentStatusSchema.safeParse(body);
    if (!validation.success) {
      return jsonResponse({ success: false, error: validation.error.issues[0]?.message || 'Invalid status data' }, 400);
    }

    const { status, notes } = validation.data;
    const updated = await updateAppointmentStatus(id, status, { id: user.userId, name: user.name }, notes);

    if (!updated) {
      return jsonResponse({ success: false, error: 'Appointment not found to update' }, 404);
    }

    // Trigger notification if patient email exists
    if (updated.patient && updated.service) {
      const emailMsg = generateAppointmentStatusUpdateEmail(updated, updated.patient, updated.service, status, notes);
      sendEmailNotification(emailMsg).catch((e) => console.error('[Notification] Status update email error:', e));
    }

    return jsonResponse({
      success: true,
      message: `Appointment ${updated.reference} updated to ${status}`,
      data: updated,
    });
  } catch (err: any) {
    return jsonResponse({ success: false, error: 'Failed to update appointment status' }, 500);
  }
};
