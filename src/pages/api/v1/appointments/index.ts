import type { APIRoute } from 'astro';
import { createAppointment, findServiceById, recordNotification } from '../../../../lib/db/store';
import {
  generateAppointmentCreatedEmail,
  generateHospitalStaffAlertEmail,
  sendEmailNotification,
} from '../../../../lib/notifications/email';
import { checkRateLimit, getClientIp } from '../../../../lib/security/rateLimit';
import { jsonResponse } from '../../../../lib/security/headers';
import { createAppointmentSchema } from '../../../../lib/validation/schemas';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  // Rate limiting: 10 requests per minute per IP
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`appointment_post_${clientIp}`, 10, 60 * 1000);
  if (!rateLimit.allowed) {
    return jsonResponse(
      {
        success: false,
        error: `Too many appointment requests. Please try again in ${rateLimit.resetInSec} seconds.`,
      },
      429,
      { 'Retry-After': String(rateLimit.resetInSec) }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return jsonResponse({ success: false, error: 'Invalid JSON request payload' }, 400);
    }

    const validation = createAppointmentSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Invalid form input';
      return jsonResponse({ success: false, error: firstError, details: validation.error.issues }, 400);
    }

    const data = validation.data;
    const idempotencyKey = data.idempotencyKey || request.headers.get('x-idempotency-key') || null;

    // Verify service exists
    const service = await findServiceById(data.serviceId);
    if (!service) {
      return jsonResponse({ success: false, error: 'Selected service does not exist or is inactive' }, 400);
    }

    // Persist appointment in database
    const appointment = await createAppointment({
      fullName: data.fullName,
      mobile: data.mobile,
      email: data.email || null,
      serviceId: service.id,
      preferredDate: data.preferredDate,
      preferredTimeSlot: data.preferredTimeSlot,
      symptomsOrNotes: data.symptomsOrNotes || null,
      idempotencyKey: idempotencyKey || undefined,
    });

    // Fire email notifications & record dispatch logs only for new requests (skip on idempotent replays)
    if (appointment.patient && !(appointment as any).isIdempotentReplay) {
      const patientMsg = generateAppointmentCreatedEmail(appointment, appointment.patient, service);
      sendEmailNotification(patientMsg).catch((err) => {
        console.error('[Notification] Error dispatching patient email:', err);
      });
      await recordNotification({
        recipientType: 'PATIENT',
        recipientContact: appointment.patient.email || appointment.patient.mobile,
        channel: 'EMAIL',
        templateName: 'APPOINTMENT_REQUEST_RECEIVED',
        subject: patientMsg.subject,
        payloadJson: JSON.stringify({ reference: appointment.reference }),
        status: 'SENT',
      });

      const staffMsg = generateHospitalStaffAlertEmail(appointment, appointment.patient, service);
      sendEmailNotification(staffMsg).catch((err) => {
        console.error('[Notification] Error dispatching staff email:', err);
      });
      await recordNotification({
        recipientType: 'CLINIC_STAFF',
        recipientContact: staffMsg.to,
        channel: 'EMAIL',
        templateName: 'STAFF_NEW_APPOINTMENT_ALERT',
        subject: staffMsg.subject,
        payloadJson: JSON.stringify({ reference: appointment.reference, patient: appointment.patient.fullName }),
        status: 'SENT',
      });
    }

    return jsonResponse(
      {
        success: true,
        message: 'Your appointment request has been registered successfully.',
        data: {
          reference: appointment.reference,
          fullName: appointment.patient?.fullName,
          serviceName: service.name,
          preferredDate: appointment.preferredDate,
          preferredTimeSlot: appointment.preferredTimeSlot,
          status: appointment.status,
          createdAt: appointment.createdAt,
        },
      },
      201
    );
  } catch (err: any) {
    console.error('[API] /appointments error:', err);
    return jsonResponse({ success: false, error: 'Internal server error processing appointment request' }, 500);
  }
};
