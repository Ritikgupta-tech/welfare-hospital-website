import { describe, it, expect } from 'vitest';
import { recordNotification, listNotificationsAdmin } from '../../src/lib/db/store';

describe('Notification Engine & Dispatch Ledger', () => {
  it('records patient confirmation notifications and retrieves them in admin ledger', async () => {
    const uniqueContact = `patient_${Date.now()}@example.com`;
    const recorded = await recordNotification({
      recipientType: 'PATIENT',
      recipientContact: uniqueContact,
      channel: 'EMAIL',
      templateName: 'APPOINTMENT_REQUEST_RECEIVED',
      subject: 'Consultation Request Received - Welfare Hospital',
      payloadJson: JSON.stringify({ reference: 'WFH-AGRA-TEST' }),
      status: 'SENT',
    });

    expect(recorded.id).toBeDefined();
    expect(recorded.recipientContact).toBe(uniqueContact);
    expect(recorded.channel).toBe('EMAIL');
    expect(recorded.status).toBe('SENT');
    expect(recorded.sentAt).toBeDefined();

    const notifications = await listNotificationsAdmin();
    expect(notifications.length).toBeGreaterThanOrEqual(1);
    const found = notifications.find((n) => n.id === recorded.id);
    expect(found).toBeDefined();
    expect(found?.templateName).toBe('APPOINTMENT_REQUEST_RECEIVED');
  });

  it('records clinic staff alerts for incoming appointments', async () => {
    const staffAlert = await recordNotification({
      recipientType: 'CLINIC_STAFF',
      recipientContact: 'desk@welfarehospital.com',
      channel: 'EMAIL',
      templateName: 'STAFF_NEW_APPOINTMENT_ALERT',
      subject: '[STAFF ALERT] New Consultation Request',
      payloadJson: JSON.stringify({ reference: 'WFH-AGRA-STAFF' }),
      status: 'SENT',
    });

    expect(staffAlert.recipientType).toBe('CLINIC_STAFF');
    expect(staffAlert.status).toBe('SENT');
  });
});
