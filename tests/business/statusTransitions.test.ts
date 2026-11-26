import { describe, it, expect } from 'vitest';
import {
  createAppointment,
  updateAppointmentStatus,
  StatusTransitionError,
  VALID_STATUS_TRANSITIONS,
} from '../../src/lib/db/store';

describe('Healthcare Status Transition Rules & State Machine', () => {
  it('allows valid linear lifecycle transitions: PENDING -> CONFIRMED -> RESCHEDULED -> COMPLETED', async () => {
    const today = new Date().toISOString().split('T')[0];
    const apt = await createAppointment({
      fullName: 'Vikram Malhotra',
      mobile: '9812345678',
      serviceId: 'primary-healthcare',
      preferredDate: today,
      preferredTimeSlot: 'Morning (10:00 AM - 01:00 PM)',
    });

    expect(apt.status).toBe('PENDING');

    // 1. PENDING -> CONFIRMED
    const confirmed = await updateAppointmentStatus(
      apt.id,
      'CONFIRMED',
      { id: 'usr_admin_001', name: 'Dr. Opee Rajput' },
      'Patient confirmed via front desk call'
    );
    expect(confirmed?.status).toBe('CONFIRMED');

    // 2. CONFIRMED -> RESCHEDULED (with updated date and slot)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const rescheduled = await updateAppointmentStatus(
      apt.id,
      'RESCHEDULED',
      { id: 'usr_admin_001', name: 'Dr. Opee Rajput' },
      'Patient requested move to tomorrow evening',
      { preferredDate: tomorrow, preferredTimeSlot: 'Evening (05:00 PM - 08:00 PM)' }
    );
    expect(rescheduled?.status).toBe('RESCHEDULED');
    expect(rescheduled?.preferredDate).toBe(tomorrow);
    expect(rescheduled?.preferredTimeSlot).toContain('Evening');

    // 3. RESCHEDULED -> COMPLETED
    const completed = await updateAppointmentStatus(
      apt.id,
      'COMPLETED',
      { id: 'usr_admin_001', name: 'Dr. Opee Rajput' },
      'Consultation conducted and medication prescribed'
    );
    expect(completed?.status).toBe('COMPLETED');
  });

  it('strictly rejects invalid status transitions from COMPLETED terminal state', async () => {
    const today = new Date().toISOString().split('T')[0];
    const apt = await createAppointment({
      fullName: 'Priya Mehra',
      mobile: '9765432109',
      serviceId: 'physician-consultations',
      preferredDate: today,
      preferredTimeSlot: 'Morning (10:00 AM - 01:00 PM)',
    });

    // Confirm then Complete
    await updateAppointmentStatus(apt.id, 'CONFIRMED', { id: 'usr_admin_001', name: 'Admin' });
    await updateAppointmentStatus(apt.id, 'COMPLETED', { id: 'usr_admin_001', name: 'Admin' });

    // Attempting to move COMPLETED -> PENDING must throw StatusTransitionError
    await expect(
      updateAppointmentStatus(apt.id, 'PENDING', { id: 'usr_admin_001', name: 'Admin' })
    ).rejects.toThrow(StatusTransitionError);

    // Attempting to move COMPLETED -> CANCELLED must throw StatusTransitionError
    await expect(
      updateAppointmentStatus(apt.id, 'CANCELLED', { id: 'usr_admin_001', name: 'Admin' })
    ).rejects.toThrow(StatusTransitionError);
  });

  it('strictly rejects invalid transitions from CANCELLED to COMPLETED', async () => {
    const today = new Date().toISOString().split('T')[0];
    const apt = await createAppointment({
      fullName: 'Rohit Sharma',
      mobile: '9654321098',
      serviceId: 'primary-healthcare',
      preferredDate: today,
      preferredTimeSlot: 'Morning (10:00 AM - 01:00 PM)',
    });

    await updateAppointmentStatus(apt.id, 'CANCELLED', { id: 'usr_admin_001', name: 'Admin' });

    // Cancelled cannot directly become Completed
    await expect(
      updateAppointmentStatus(apt.id, 'COMPLETED', { id: 'usr_admin_001', name: 'Admin' })
    ).rejects.toThrow(StatusTransitionError);
  });
});
