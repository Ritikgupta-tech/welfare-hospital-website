import { describe, it, expect } from 'vitest';
import {
  createAppointment,
  updateAppointmentStatus,
  ConcurrencyConflictError,
} from '../../src/lib/db/store';

describe('Concurrency Safety & Duplicate Submission Prevention', () => {
  it('detects concurrent modification conflicts when expectedUpdatedAt does not match', async () => {
    const today = new Date().toISOString().split('T')[0];
    const apt = await createAppointment({
      fullName: 'Anita Deshmukh',
      mobile: '9543210987',
      serviceId: 'primary-healthcare',
      preferredDate: today,
      preferredTimeSlot: 'Morning (10:00 AM - 01:00 PM)',
    });

    const initialUpdatedAt = apt.updatedAt;

    // Staff member A updates status to CONFIRMED
    await updateAppointmentStatus(
      apt.id,
      'CONFIRMED',
      { id: 'usr_staff_a', name: 'Staff A' },
      'Staff A confirmation'
    );

    // Staff member B attempts to update using stale initialUpdatedAt
    await expect(
      updateAppointmentStatus(
        apt.id,
        'CANCELLED',
        { id: 'usr_staff_b', name: 'Staff B' },
        'Staff B cancellation attempt',
        undefined,
        initialUpdatedAt // Stale timestamp
      )
    ).rejects.toThrow(ConcurrencyConflictError);
  });

  it('prevents duplicate appointments for identical patient and date within 5 minutes', async () => {
    const uniquePhone = `95${Math.floor(10000000 + Math.random() * 90000000)}`;
    const today = new Date().toISOString().split('T')[0];

    // First submission
    const firstApt = await createAppointment({
      fullName: 'Rajesh Khanna',
      mobile: uniquePhone,
      serviceId: 'physician-consultations',
      preferredDate: today,
      preferredTimeSlot: 'Morning (10:00 AM - 01:00 PM)',
    });

    // Rapid second submission (e.g. double-click)
    const secondApt = await createAppointment({
      fullName: 'Rajesh Khanna',
      mobile: uniquePhone,
      serviceId: 'physician-consultations',
      preferredDate: today,
      preferredTimeSlot: 'Morning (10:00 AM - 01:00 PM)',
    });

    // Must return the existing appointment reference rather than generating duplicates
    expect(secondApt.reference).toBe(firstApt.reference);
    expect(secondApt.id).toBe(firstApt.id);
  });

  it('honors unique idempotencyKey for exact retries while allowing separate bookings', async () => {
    const uniquePhone = `94${Math.floor(10000000 + Math.random() * 90000000)}`;
    const today = new Date().toISOString().split('T')[0];
    const key1 = `idem_key_${Date.now()}_1`;

    // 1. Initial submission with key1
    const apt1 = await createAppointment({
      fullName: 'Sunita Rao',
      mobile: uniquePhone,
      serviceId: 'primary-healthcare',
      preferredDate: today,
      preferredTimeSlot: 'Morning (10:00 AM - 01:00 PM)',
      idempotencyKey: key1,
    });

    expect(apt1.idempotencyKey).toBe(key1);

    // 2. Exact retry with same key1
    const replay = await createAppointment({
      fullName: 'Sunita Rao',
      mobile: uniquePhone,
      serviceId: 'primary-healthcare',
      preferredDate: today,
      preferredTimeSlot: 'Morning (10:00 AM - 01:00 PM)',
      idempotencyKey: key1,
    });

    expect(replay.reference).toBe(apt1.reference);
    expect(replay.isIdempotentReplay).toBe(true);

    // 3. Legitimate second booking by same patient with distinct key2 (e.g., evening follow-up)
    const key2 = `idem_key_${Date.now()}_2`;
    const apt2 = await createAppointment({
      fullName: 'Sunita Rao',
      mobile: uniquePhone,
      serviceId: 'physician-consultations',
      preferredDate: today,
      preferredTimeSlot: 'Evening (05:00 PM - 08:00 PM)',
      idempotencyKey: key2,
    });

    expect(apt2.reference).not.toBe(apt1.reference);
    expect(apt2.idempotencyKey).toBe(key2);
    expect(apt2.serviceId).toBe('srv_physician_002');
  });
});
