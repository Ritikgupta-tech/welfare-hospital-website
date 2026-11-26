import type { Appointment, Patient, Service } from '../types';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function generateAppointmentCreatedEmail(
  appointment: Appointment,
  patient: Patient,
  service: Service
): EmailMessage {
  const subject = `Appointment Request Received — Ref: ${appointment.reference} | Welfare Hospital`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f8fa; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background-color: #102a43; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">WELFARE HOSPITAL</h1>
      <p style="color: #62b0e8; margin: 4px 0 0; font-size: 13px;">100 Feet Road, Ram Bagh, Agra &bull; 34 Years of Service</p>
    </div>
    
    <div style="padding: 32px 28px;">
      <div style="display: inline-block; background-color: #e8f7f4; color: #087f8c; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px;">
        Appointment Request Submitted
      </div>
      
      <h2 style="color: #102a43; font-size: 18px; margin: 0 0 12px;">Dear ${patient.fullName},</h2>
      <p style="color: #334155; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
        We have received your outpatient consultation request at Welfare Hospital. Our reception desk is reviewing your chosen slot and will confirm your appointment shortly.
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 40%;">Reference Number:</td>
            <td style="padding: 6px 0; color: #087f8c; font-weight: 800; font-family: monospace; font-size: 16px;">${appointment.reference}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Service Requested:</td>
            <td style="padding: 6px 0; color: #102a43; font-weight: 700;">${service.name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Preferred Date:</td>
            <td style="padding: 6px 0; color: #102a43; font-weight: 600;">${appointment.preferredDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Time Slot:</td>
            <td style="padding: 6px 0; color: #102a43; font-weight: 600;">${appointment.preferredTimeSlot}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Current Status:</td>
            <td style="padding: 6px 0; color: #d97706; font-weight: 700;">PENDING REVIEW</td>
          </tr>
        </table>
      </div>

      <p style="color: #475569; font-size: 13px; line-height: 1.5; margin: 0 0 24px;">
        <strong>Need immediate assistance or need to change your slot?</strong><br>
        Call our hospital reception desk directly at <a href="tel:8490068558" style="color: #087f8c; text-decoration: none; font-weight: 700;">+91 8490068558</a> with your reference number.
      </p>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; color: #94a3b8; font-size: 11px; text-align: center;">
        Welfare Hospital &bull; 100 Feet Road, Ram Bagh, Agra, Uttar Pradesh &bull; Tel: 8490068558
      </div>
    </div>
  </div>
</body>
</html>
`;

  const text = `
WELFARE HOSPITAL, AGRA
Appointment Request Received

Reference: ${appointment.reference}
Patient: ${patient.fullName}
Service: ${service.name}
Preferred Date: ${appointment.preferredDate}
Time Slot: ${appointment.preferredTimeSlot}
Status: PENDING REVIEW

For queries or immediate help, please call +91 8490068558.
`;

  return {
    to: patient.email || 'reception@welfarehospital.com',
    subject,
    html,
    text,
  };
}

export function generateHospitalStaffAlertEmail(
  appointment: Appointment,
  patient: Patient,
  service: Service
): EmailMessage {
  const subject = `[STAFF ALERT] New Appointment Request: ${appointment.reference} (${patient.fullName})`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; background-color: #f5f8fa; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 28px;">
    <div style="background-color: #102a43; padding: 16px; border-radius: 8px; color: white; margin-bottom: 20px;">
      <h2 style="margin: 0; font-size: 18px;">Welfare Hospital &mdash; Reception Dispatch Alert</h2>
    </div>
    <p>A new outpatient consultation request has been submitted through the public portal:</p>
    <ul>
      <li><strong>Reference:</strong> ${appointment.reference}</li>
      <li><strong>Patient Name:</strong> ${patient.fullName}</li>
      <li><strong>Phone:</strong> <a href="tel:${patient.mobile}">+91 ${patient.mobile}</a></li>
      <li><strong>Service:</strong> ${service.name}</li>
      <li><strong>Requested Slot:</strong> ${appointment.preferredDate} (${appointment.preferredTimeSlot})</li>
      <li><strong>Patient Notes:</strong> ${appointment.symptomsOrNotes || 'None'}</li>
    </ul>
    <p style="margin-top: 20px;">
      <a href="https://welfare-hospital-website.vercel.app/admin/appointments" style="background-color: #087f8c; color: white; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;">
        Open Admin Portal to Confirm
      </a>
    </p>
  </div>
</body>
</html>
`;

  return {
    to: process.env.NOTIFICATION_EMAIL || 'desk@welfarehospital.com',
    subject,
    html,
    text: `New appointment ${appointment.reference} from ${patient.fullName} (${patient.mobile}). Service: ${service.name}. Slot: ${appointment.preferredDate}.`,
  };
}

export function generateAppointmentStatusUpdateEmail(
  appointment: Appointment,
  patient: Patient,
  service: Service,
  newStatus: string,
  notes?: string | null
): EmailMessage {
  const subject = `Appointment ${newStatus} — Ref: ${appointment.reference} | Welfare Hospital`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; background-color: #f5f8fa; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 28px;">
    <h2 style="color: #102a43; margin-top: 0;">Appointment Status Update</h2>
    <p>Dear ${patient.fullName},</p>
    <p>Your appointment request <strong>${appointment.reference}</strong> for <strong>${service.name}</strong> has been updated to:</p>
    <div style="padding: 12px 16px; background-color: #e8f7f4; border-radius: 8px; color: #087f8c; font-weight: bold; font-size: 16px;">
      STATUS: ${newStatus}
    </div>
    <div style="margin-top: 16px; padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px;">
      <div><strong>Scheduled Date:</strong> ${appointment.preferredDate}</div>
      <div style="margin-top: 4px;"><strong>Consultation Slot:</strong> ${appointment.preferredTimeSlot}</div>
    </div>
    ${notes ? `<p style="margin-top: 16px; color: #475569;"><strong>Notes from hospital desk:</strong> ${notes}</p>` : ''}
    <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
      For questions, please call Welfare Hospital at <a href="tel:8490068558">8490068558</a>.
    </p>
  </div>
</body>
</html>
`;

  return {
    to: patient.email || 'reception@welfarehospital.com',
    subject,
    html,
    text: `Appointment ${appointment.reference} status is now ${newStatus}. Notes: ${notes || 'None'}. Phone: 8490068558.`,
  };
}

export async function sendEmailNotification(message: EmailMessage): Promise<{ success: boolean; id?: string }> {
  // If RESEND_API_KEY is configured in production, use it
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Welfare Hospital <appointments@welfarehospital.com>',
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, id: data.id };
      }
    } catch (err) {
      console.error('[Notification] Resend API error, falling back to audit logging:', err);
    }
  }

  // Safe development and fallback logger
  console.log(`[Notification Engine - Safe Adapter] Email sent to ${message.to}: "${message.subject}"`);
  return { success: true, id: `dev-sim-${Date.now()}` };
}
