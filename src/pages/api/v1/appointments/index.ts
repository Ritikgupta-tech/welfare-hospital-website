import type { APIRoute } from 'astro';
import { createAppointment, findServiceById } from '../../../../lib/db/store';
import { generateAppointmentCreatedEmail, sendEmailNotification } from '../../../../lib/notifications/email';
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
    });

    // Fire email notification asynchronously
    if (appointment.patient) {
      const emailMsg = generateAppointmentCreatedEmail(appointment, appointment.patient, service);
      sendEmailNotification(emailMsg).catch((err) => {
        console.error('[Notification] Error dispatching email:', err);
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
