import { describe, it, expect } from 'vitest';
import { validateCsrfOrigin } from '../../src/lib/security/csrf';

describe('CSRF Cross-Origin Protection Tests', () => {
  it('allows safe idempotent HTTP methods unconditionally', () => {
    const getReq = new Request('https://welfare-hospital-website.vercel.app/api/v1/services', {
      method: 'GET',
    });
    expect(validateCsrfOrigin(getReq).valid).toBe(true);

    const headReq = new Request('https://welfare-hospital-website.vercel.app/api/v1/health', {
      method: 'HEAD',
    });
    expect(validateCsrfOrigin(headReq).valid).toBe(true);
  });

  it('allows Bearer-token authenticated API requests', () => {
    const apiReq = new Request('https://welfare-hospital-website.vercel.app/api/v1/admin/appointments/apt_1', {
      method: 'PATCH',
      headers: {
        authorization: 'Bearer valid.jwt.token',
      },
    });
    expect(validateCsrfOrigin(apiReq).valid).toBe(true);
  });

  it('allows trusted same-origin and localhost requests', () => {
    const prodReq = new Request('https://welfare-hospital-website.vercel.app/api/v1/admin/appointments/apt_1', {
      method: 'PATCH',
      headers: {
        origin: 'https://welfare-hospital-website.vercel.app',
        cookie: 'welfare_admin_token=sample_jwt',
      },
    });
    expect(validateCsrfOrigin(prodReq).valid).toBe(true);

    const localReq = new Request('http://localhost:4321/api/v1/admin/appointments/apt_1', {
      method: 'PATCH',
      headers: {
        origin: 'http://localhost:4321',
        cookie: 'welfare_admin_token=sample_jwt',
      },
    });
    expect(validateCsrfOrigin(localReq).valid).toBe(true);
  });

  it('blocks untrusted cross-origin mutation requests with ambient cookies', () => {
    const maliciousReq = new Request('https://welfare-hospital-website.vercel.app/api/v1/admin/appointments/apt_1', {
      method: 'PATCH',
      headers: {
        origin: 'https://malicious-phishing-site.com',
        cookie: 'welfare_admin_token=victim_stolen_session',
      },
    });
    const result = validateCsrfOrigin(maliciousReq);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Untrusted cross-origin');
  });
});
