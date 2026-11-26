import type { APIRoute } from 'astro';
import { extractBearerToken, extractCookieToken, verifyToken } from '../../../../../lib/auth/jwt';
import {
  ConcurrencyConflictError,
  StatusTransitionError,
  getAppointmentById,
  recordNotification,
  updateAppointmentStatus,
} from '../../../../../lib/db/store';
import { generateAppointmentStatusUpdateEmail, sendEmailNotification } from '../../../../../lib/notifications/email';
import { jsonResponse } from '../../../../../lib/security/headers';
import { updateAppointmentStatusSchema } from '../../../../../lib/validation/schemas';
import { validateCsrfOrigin } from '../../../../../lib/security/csrf';

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
  const csrf = validateCsrfOrigin(request);
  if (!csrf.valid) {
    return jsonResponse({ success: false, error: 'Forbidden: CSRF verification failed' }, 403);
  }

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

    const { status, notes, preferredDate, preferredTimeSlot } = validation.data;
    const expectedUpdatedAt = body?.expectedUpdatedAt;

    const updated = await updateAppointmentStatus(
      id,
      status,
      { id: user.userId, name: user.name },
      notes,
      { preferredDate, preferredTimeSlot },
      expectedUpdatedAt
    );

    if (!updated) {
      return jsonResponse({ success: false, error: 'Appointment not found to update' }, 404);
    }

    // Trigger notification if patient email exists
    if (updated.patient && updated.service) {
      const emailMsg = generateAppointmentStatusUpdateEmail(updated, updated.patient, updated.service, status, notes);
      sendEmailNotification(emailMsg).catch((e) => console.error('[Notification] Status update email error:', e));

      await recordNotification({
        recipientType: 'PATIENT',
        recipientContact: updated.patient.email || updated.patient.mobile,
        channel: 'EMAIL',
        templateName: `STATUS_${status}`,
        subject: emailMsg.subject,
        payloadJson: JSON.stringify({
          reference: updated.reference,
          status,
          notes,
          preferredDate: updated.preferredDate,
          preferredTimeSlot: updated.preferredTimeSlot,
        }),
        status: 'SENT',
      });
    }

    return jsonResponse({
      success: true,
      message: `Appointment ${updated.reference} updated to ${status}`,
      data: updated,
    });
  } catch (err: any) {
    if (err instanceof ConcurrencyConflictError) {
      return jsonResponse({ success: false, error: err.message, isConflict: true }, 409);
    }
    if (err instanceof StatusTransitionError) {
      return jsonResponse({ success: false, error: err.message }, 400);
    }
    return jsonResponse({ success: false, error: 'Failed to update appointment status' }, 500);
  }
};
