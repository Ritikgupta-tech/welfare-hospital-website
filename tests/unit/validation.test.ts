import { describe, it, expect } from 'vitest';
import { createAppointmentSchema, loginSchema, indianMobileRegex } from '../../src/lib/validation/schemas';

describe('Validation Schemas Unit Tests', () => {
  it('validates correct 10-digit Indian mobile numbers', () => {
    expect(indianMobileRegex.test('8490068558')).toBe(true);
    expect(indianMobileRegex.test('9876543210')).toBe(true);
    expect(indianMobileRegex.test('7000000000')).toBe(true);
    expect(indianMobileRegex.test('6200000000')).toBe(true);

    // Invalid numbers
    expect(indianMobileRegex.test('5490068558')).toBe(false); // starts with 5
    expect(indianMobileRegex.test('849006855')).toBe(false);  // 9 digits
    expect(indianMobileRegex.test('84900685588')).toBe(false); // 11 digits
    expect(indianMobileRegex.test('abcdefghij')).toBe(false);
  });

  it('accepts valid appointment payload', () => {
    const today = new Date().toISOString().split('T')[0];
    const validData = {
      fullName: 'Sunil Verma',
      mobile: '9897123456',
      email: 'sunil@example.com',
      serviceId: 'primary-healthcare',
      preferredDate: today,
      preferredTimeSlot: 'Morning (10:00 AM - 01:00 PM)',
      symptomsOrNotes: 'Routine fever checkup',
    };

    const result = createAppointmentSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects past appointment date', () => {
    const pastData = {
      fullName: 'Sunil Verma',
      mobile: '9897123456',
      serviceId: 'primary-healthcare',
      preferredDate: '2020-01-01',
      preferredTimeSlot: 'Morning (10:00 AM - 01:00 PM)',
    };

    const result = createAppointmentSchema.safeParse(pastData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('past');
    }
  });

  it('validates admin login schema', () => {
    expect(loginSchema.safeParse({ email: 'admin@welfarehospital.com', password: 'password123' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'not-an-email', password: '123' }).success).toBe(false);
  });
});
