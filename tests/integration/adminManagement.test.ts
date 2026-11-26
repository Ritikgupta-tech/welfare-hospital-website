import { describe, it, expect } from 'vitest';
import {
  createService,
  updateService,
  getAllServicesAdmin,
  createDoctor,
  updateDoctor,
  getAllDoctorsAdmin,
} from '../../src/lib/db/store';

describe('Admin Management Operations (Services & Doctors)', () => {
  it('creates, retrieves, and updates clinical services', async () => {
    const serviceName = `Pediatric Wellness ${Date.now()}`;
    const created = await createService({
      name: serviceName,
      category: 'Pediatric Care',
      shortDesc: 'Routine pediatric monitoring for infants and children',
      fullDesc: 'Comprehensive infant checkups, growth chart monitoring, and clinical guidance for young patients.',
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe(serviceName);
    expect(created.isPublished).toBe(true);

    // Update visibility to unpublished
    const updated = await updateService(created.id, { isPublished: false });
    expect(updated).not.toBeNull();
    expect(updated?.isPublished).toBe(false);

    // List all admin services
    const all = await getAllServicesAdmin();
    expect(all.some((s) => s.id === created.id)).toBe(true);
  });

  it('manages doctor profiles and consultation timings', async () => {
    const doctors = await getAllDoctorsAdmin();
    expect(doctors.length).toBeGreaterThanOrEqual(1);

    const leadDoctor = doctors[0];
    expect(leadDoctor.name).toBe('Dr. Opee Rajput');
    expect(leadDoctor.experienceYears).toBe(34);

    // Update timings
    const updated = await updateDoctor(leadDoctor.id, {
      opdTimings: 'Monday – Saturday: 10:00 AM – 1:30 PM & 5:00 PM – 8:30 PM',
    });
    expect(updated).not.toBeNull();
    expect(updated?.opdTimings).toContain('8:30 PM');
  });
});
