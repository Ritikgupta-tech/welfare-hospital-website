import { describe, it, expect } from 'vitest';
import {
  createAppointment,
  findAppointmentByReference,
  updateAppointmentStatus,
  listAppointments,
  getDashboardMetrics,
} from '../../src/lib/db/store';

describe('Appointment & Database Lifecycle Integration Tests', () => {
  it('executes full end-to-end appointment lifecycle', async () => {
    const today = new Date().toISOString().split('T')[0];
    const uniquePhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

    // 1. Patient creates appointment
    const appointment = await createAppointment({
      fullName: 'Aarav Sharma',
      mobile: uniquePhone,
      email: 'aarav@example.com',
      serviceId: 'physician-consultations',
      preferredDate: today,
      preferredTimeSlot: 'Morning (10:00 AM - 01:00 PM)',
      symptomsOrNotes: 'High fever and headache since 2 days',
    });

    expect(appointment.id).toBeDefined();
    expect(appointment.reference).toMatch(/^WFH-AGRA-[A-Z0-9]{4}$/);
    expect(appointment.status).toBe('PENDING');
    expect(appointment.patient?.fullName).toBe('Aarav Sharma');

    // 2. Public masked lookup returns reference with masked patient details
    const publicLookup = await findAppointmentByReference(appointment.reference);
    expect(publicLookup).not.toBeNull();
    expect(publicLookup?.reference).toBe(appointment.reference);
    expect(publicLookup?.status).toBe('PENDING');
    const expectedMasked = uniquePhone.substring(0, 2) + '******' + uniquePhone.substring(8);
    expect(publicLookup?.patient?.mobile).toBe(expectedMasked); // masked for privacy

    // 3. Admin updates status to CONFIRMED
    const updated = await updateAppointmentStatus(
      appointment.id,
      'CONFIRMED',
      { id: 'usr_admin_001', name: 'Dr. Opee Rajput' },
      'Patient confirmed via call for 10:30 AM.'
    );

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('CONFIRMED');
    expect(updated?.adminNotes).toBe('Patient confirmed via call for 10:30 AM.');

    // 4. Listing appointments retrieves the updated record
    const list = await listAppointments({ search: appointment.reference });
    expect(list.total).toBeGreaterThanOrEqual(1);
    expect(list.appointments[0].reference).toBe(appointment.reference);
    expect(list.appointments[0].status).toBe('CONFIRMED');

    // 5. Dashboard metrics reflect the operational counts
    const metrics = await getDashboardMetrics();
    expect(metrics.totalAppointments).toBeGreaterThanOrEqual(1);
    expect(metrics.confirmedAppointments).toBeGreaterThanOrEqual(1);
  });
});
