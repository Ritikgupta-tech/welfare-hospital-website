import { describe, it, expect } from 'vitest';
import {
  findAdminByEmail,
  updateAdminPassword,
  listAuditLogs,
} from '../../src/lib/db/store';
import { hashPassword, verifyPassword } from '../../src/lib/auth/password';

describe('Administrative Password Rotation & Security Audit', () => {
  it('rotates password, writes audit log, and verifies new hash with bcrypt', async () => {
    const admin = await findAdminByEmail('admin@welfarehospital.com');
    expect(admin).toBeDefined();

    const previousHash = admin!.passwordHash;
    const newSecurePassword = 'NewSecureHospitalPass#2026';
    const newHash = await hashPassword(newSecurePassword);

    const updated = await updateAdminPassword(admin!.id, newHash);
    expect(updated).toBe(true);

    const reloaded = await findAdminByEmail('admin@welfarehospital.com');
    expect(reloaded?.passwordHash).toBe(newHash);
    expect(reloaded?.passwordHash).not.toBe(previousHash);

    // Verify new password validates and old does not
    expect(await verifyPassword(newSecurePassword, reloaded!.passwordHash)).toBe(true);
    expect(await verifyPassword('WrongPassword123!', reloaded!.passwordHash)).toBe(false);

    // Verify security audit trail recorded the rotation
    const auditLogs = await listAuditLogs();
    const rotationLog = auditLogs.find((l) => l.action === 'ADMIN_PASSWORD_ROTATED');
    expect(rotationLog).toBeDefined();
    expect(rotationLog?.entityType).toBe('ADMIN_USER');

    // Restore original hash for test environment consistency
    await updateAdminPassword(admin!.id, previousHash);
  });
});
