import { describe, it, expect } from 'vitest';
import { findServiceById, getServices } from '../../src/lib/db/store';

describe('Clinical Service Lookup & Slug Resolution Resilience', () => {
  it('resolves services by canonical ID, slug, and human name', async () => {
    const byId = await findServiceById('srv_primary_001');
    expect(byId).toBeDefined();
    expect(byId?.name).toBe('Primary Healthcare');

    const bySlug = await findServiceById('primary-healthcare');
    expect(bySlug).toBeDefined();
    expect(bySlug?.id).toBe('srv_primary_001');

    const byName = await findServiceById('Primary Healthcare');
    expect(byName).toBeDefined();
    expect(byName?.slug).toBe('primary-healthcare');
  });

  it('resolves common UI aliases and synonyms to valid healthcare services', async () => {
    // 'General Healthcare' alias maps to 'primary-healthcare'
    const generalHealth = await findServiceById('General Healthcare');
    expect(generalHealth).toBeDefined();
    expect(generalHealth?.slug).toBe('primary-healthcare');

    // 'Physician Consultation' alias maps to 'physician-consultations'
    const physician = await findServiceById('Physician Consultation');
    expect(physician).toBeDefined();
    expect(physician?.slug).toBe('physician-consultations');

    // 'General Medical Assessment' maps to 'routine-health-checks'
    const assessment = await findServiceById('General Medical Assessment');
    expect(assessment).toBeDefined();
    expect(assessment?.slug).toBe('routine-health-checks');

    // 'Follow-up Consultation' maps to 'continuing-care'
    const followUp = await findServiceById('Follow-up Consultation');
    expect(followUp).toBeDefined();
    expect(followUp?.slug).toBe('continuing-care');
  });

  it('handles case-insensitivity and whitespace cleanly', async () => {
    const mixedCase = await findServiceById('  PHYSICIAN-CONSULTATIONS  ');
    expect(mixedCase).toBeDefined();
    expect(mixedCase?.slug).toBe('physician-consultations');
  });
});
