import { describe, it, expect } from 'vitest';
import { extractBearerToken, extractCookieToken, signToken, verifyToken } from '../../src/lib/auth/jwt';
import { findAppointmentByReference, createAppointment } from '../../src/lib/db/store';

describe('Role-Based Authorization & Privacy Boundary Tests', () => {
  it('extracts bearer token and cookie token accurately', () => {
    const bearer = extractBearerToken('Bearer sample.jwt.token');
    expect(bearer).toBe('sample.jwt.token');

    const noBearer = extractBearerToken('Basic dXNlcjpwYXNz');
    expect(noBearer).toBeNull();

    const cookie = extractCookieToken('other=123; welfare_admin_token=my_secure_token; theme=dark');
    expect(cookie).toBe('my_secure_token');

    const emptyCookie = extractCookieToken(null);
    expect(emptyCookie).toBeNull();
  });

  it('rejects tampered or forged JWT tokens', () => {
    const valid = signToken({
      userId: 'usr_test_1',
      email: 'test@welfarehospital.com',
      name: 'Test Staff',
      role: 'RECEPTIONIST',
    });

    // Tamper with payload
    const parts = valid.split('.');
    const tampered = `${parts[0]}.${parts[1]}xyz.${parts[2]}`;
    expect(verifyToken(tampered)).toBeNull();
  });

  it('masks patient phone numbers and emails on public reference lookups to protect patient privacy', async () => {
    const today = new Date().toISOString().split('T')[0];
    const uniquePhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const apt = await createAppointment({
      fullName: 'Suresh Chandra Gupta',
      mobile: uniquePhone,
      email: 'suresh.gupta@example.com',
      serviceId: 'primary-healthcare',
      preferredDate: today,
      preferredTimeSlot: 'Morning (10:00 AM - 01:00 PM)',
    });

    const publicLookup = await findAppointmentByReference(apt.reference);
    expect(publicLookup).not.toBeNull();
    // Mobile must be masked with first 2 and last 2 digits
    const expectedMasked = uniquePhone.substring(0, 2) + '******' + uniquePhone.substring(8);
    expect(publicLookup?.patient?.mobile).toBe(expectedMasked);
    // Name must be masked
    expect(publicLookup?.patient?.fullName).not.toBe('Suresh Chandra Gupta');
    expect(publicLookup?.patient?.fullName).toContain('*');
    // Email must be masked
    expect(publicLookup?.patient?.email).toContain('***@');
  });
});
