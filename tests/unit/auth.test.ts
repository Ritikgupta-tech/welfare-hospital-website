import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/lib/auth/password';
import { signToken, verifyToken } from '../../src/lib/auth/jwt';

describe('Security & Authentication Unit Tests', () => {
  it('correctly hashes and verifies passwords using bcrypt', async () => {
    const raw = 'SecurePassword@2026';
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);

    const isMatch = await verifyPassword(raw, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword('WrongPassword', hash);
    expect(isWrongMatch).toBe(false);
  });

  it('signs and verifies administrative JWT tokens', () => {
    const payload = {
      userId: 'usr_admin_test_01',
      email: 'admin@welfarehospital.com',
      name: 'Admin Test',
      role: 'SUPER_ADMIN' as const,
    };

    const token = signToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.email).toBe('admin@welfarehospital.com');
    expect(decoded?.role).toBe('SUPER_ADMIN');

    // Invalid token returns null
    expect(verifyToken('invalid.jwt.token')).toBeNull();
  });
});
