import type { APIRoute } from 'astro';
import { findAppointmentByReference } from '../../../../../lib/db/store';
import { jsonResponse } from '../../../../../lib/security/headers';
import { checkRateLimit, getClientIp } from '../../../../../lib/security/rateLimit';

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`ref_lookup_${clientIp}`, 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return jsonResponse(
      { success: false, error: 'Too many status inquiries. Please wait a minute.' },
      429,
      { 'Retry-After': String(rateLimit.resetInSec) }
    );
  }

  const reference = params.reference;
  if (!reference || reference.length < 5) {
    return jsonResponse({ success: false, error: 'Valid appointment reference code is required' }, 400);
  }

  try {
    const appointment = await findAppointmentByReference(reference);
    if (!appointment) {
      return jsonResponse(
        {
          success: false,
          error: `No appointment found with reference code "${reference}". Please check the code or contact front desk.`,
        },
        404
      );
    }

    return jsonResponse({
      success: true,
      data: {
        reference: appointment.reference,
        patientName: appointment.patient?.fullName,
        serviceName: appointment.service?.name,
        preferredDate: appointment.preferredDate,
        preferredTimeSlot: appointment.preferredTimeSlot,
        status: appointment.status,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
      },
    });
  } catch (err) {
    return jsonResponse({ success: false, error: 'Server error looking up appointment' }, 500);
  }
};
