import fs from 'node:fs';
import path from 'node:path';
import { getPrismaClient, isPostgresConnected } from './prisma';

interface MigrationReport {
  success: boolean;
  adminUsersMigrated: number;
  patientsMigrated: number;
  doctorsMigrated: number;
  servicesMigrated: number;
  appointmentsMigrated: number;
  statusHistoriesMigrated: number;
  notificationsMigrated: number;
  auditLogsMigrated: number;
  settingsMigrated: number;
  errors: string[];
}

/**
 * Deterministically migrates data from .data/hospital_db.json into PostgreSQL
 * via Prisma Client with referential integrity preservation.
 */
export async function migrateJsonToPostgres(): Promise<MigrationReport> {
  const report: MigrationReport = {
    success: false,
    adminUsersMigrated: 0,
    patientsMigrated: 0,
    doctorsMigrated: 0,
    servicesMigrated: 0,
    appointmentsMigrated: 0,
    statusHistoriesMigrated: 0,
    notificationsMigrated: 0,
    auditLogsMigrated: 0,
    settingsMigrated: 0,
    errors: [],
  };

  const prisma = getPrismaClient();
  if (!prisma) {
    report.errors.push('No DATABASE_URL configured. Cannot migrate to PostgreSQL.');
    return report;
  }

  const isConnected = await isPostgresConnected();
  if (!isConnected) {
    report.errors.push('PostgreSQL connection ping failed. Verify DATABASE_URL connectivity.');
    return report;
  }

  const jsonPath = path.resolve(process.cwd(), '.data', 'hospital_db.json');
  if (!fs.existsSync(jsonPath)) {
    report.errors.push(`No JSON data file found at ${jsonPath}`);
    return report;
  }

  try {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(raw);

    await prisma.$transaction(async (tx) => {
      // 1. Admin Users
      if (Array.isArray(data.adminUsers)) {
        for (const u of data.adminUsers) {
          await tx.adminUser.upsert({
            where: { email: u.email },
            update: {
              name: u.name,
              passwordHash: u.passwordHash,
              role: u.role || 'ADMIN',
              isActive: u.isActive !== undefined ? u.isActive : true,
              lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : null,
              updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
            },
            create: {
              id: u.id,
              email: u.email,
              name: u.name,
              passwordHash: u.passwordHash,
              role: u.role || 'ADMIN',
              isActive: u.isActive !== undefined ? u.isActive : true,
              lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : null,
              createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
              updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
            },
          });
          report.adminUsersMigrated++;
        }
      }

      // 2. Doctors
      if (Array.isArray(data.doctors)) {
        for (const d of data.doctors) {
          await tx.doctor.upsert({
            where: { id: d.id },
            update: {
              name: d.name,
              title: d.title,
              department: d.department,
              qualifications: d.qualifications,
              experienceYears: d.experienceYears || 34,
              opdTimings: d.opdTimings,
              isPublished: d.isPublished !== undefined ? d.isPublished : true,
              updatedAt: d.updatedAt ? new Date(d.updatedAt) : new Date(),
            },
            create: {
              id: d.id,
              name: d.name,
              title: d.title,
              department: d.department,
              qualifications: d.qualifications,
              experienceYears: d.experienceYears || 34,
              opdTimings: d.opdTimings,
              isPublished: d.isPublished !== undefined ? d.isPublished : true,
              createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
              updatedAt: d.updatedAt ? new Date(d.updatedAt) : new Date(),
            },
          });
          report.doctorsMigrated++;
        }
      }

      // 3. Services
      if (Array.isArray(data.services)) {
        for (const s of data.services) {
          await tx.service.upsert({
            where: { slug: s.slug },
            update: {
              name: s.name,
              category: s.category,
              shortDesc: s.shortDesc,
              fullDesc: s.fullDesc,
              iconName: s.iconName || 'Stethoscope',
              isPublished: s.isPublished !== undefined ? s.isPublished : true,
              updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
            },
            create: {
              id: s.id,
              name: s.name,
              slug: s.slug,
              category: s.category,
              shortDesc: s.shortDesc,
              fullDesc: s.fullDesc,
              iconName: s.iconName || 'Stethoscope',
              isPublished: s.isPublished !== undefined ? s.isPublished : true,
              createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
              updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
            },
          });
          report.servicesMigrated++;
        }
      }

      // 4. Patients
      if (Array.isArray(data.patients)) {
        for (const p of data.patients) {
          await tx.patient.upsert({
            where: { mobile: p.mobile },
            update: {
              fullName: p.fullName,
              email: p.email || null,
              city: p.city || 'Agra',
              notes: p.notes || null,
              updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
            },
            create: {
              id: p.id,
              fullName: p.fullName,
              mobile: p.mobile,
              email: p.email || null,
              city: p.city || 'Agra',
              notes: p.notes || null,
              createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
              updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
            },
          });
          report.patientsMigrated++;
        }
      }

      // 5. Appointments
      if (Array.isArray(data.appointments)) {
        for (const a of data.appointments) {
          await tx.appointment.upsert({
            where: { reference: a.reference },
            update: {
              status: a.status || 'PENDING',
              adminNotes: a.adminNotes || null,
              preferredDate: new Date(a.preferredDate),
              preferredTimeSlot: a.preferredTimeSlot,
              updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
            },
            create: {
              id: a.id,
              reference: a.reference,
              idempotencyKey: a.idempotencyKey || null,
              patientId: a.patientId,
              doctorId: a.doctorId || null,
              serviceId: a.serviceId,
              preferredDate: new Date(a.preferredDate),
              preferredTimeSlot: a.preferredTimeSlot,
              status: a.status || 'PENDING',
              symptomsOrNotes: a.symptomsOrNotes || null,
              adminNotes: a.adminNotes || null,
              createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
              updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
            },
          });
          report.appointmentsMigrated++;
        }
      }

      // 6. Hospital Settings
      if (Array.isArray(data.settings)) {
        for (const set of data.settings) {
          await tx.hospitalSetting.upsert({
            where: { key: set.key },
            update: {
              value: set.value,
              description: set.description || null,
              updatedAt: set.updatedAt ? new Date(set.updatedAt) : new Date(),
            },
            create: {
              id: set.id,
              key: set.key,
              value: set.value,
              description: set.description || null,
              updatedAt: set.updatedAt ? new Date(set.updatedAt) : new Date(),
            },
          });
          report.settingsMigrated++;
        }
      }
    });

    report.success = true;
  } catch (err: any) {
    report.errors.push(`Transaction failed: ${err.message}`);
  }

  return report;
}
