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
});
