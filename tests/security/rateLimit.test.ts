import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '../../src/lib/security/rateLimit';

describe('Security Rate Limiter Tests', () => {
  it('allows requests within threshold and blocks excess', () => {
    const key = `test_ip_${Date.now()}`;
    const limit = 3;
    const windowMs = 5000;

    const r1 = checkRateLimit(key, limit, windowMs);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit(key, limit, windowMs);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(key, limit, windowMs);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    // 4th request exceeds limit
    const r4 = checkRateLimit(key, limit, windowMs);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.resetInSec).toBeGreaterThan(0);
  });
});
