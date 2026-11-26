-- Welfare Hospital PostgreSQL Database Schema Initialization
-- Compatible with Neon, Supabase, Vercel Postgres, AWS RDS, Railway, and Standard PostgreSQL 14+

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'REJECTED', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Admin Users Table
CREATE TABLE IF NOT EXISTS "admin_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Patients Table
CREATE TABLE IF NOT EXISTS "patients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL UNIQUE,
    "email" TEXT,
    "city" TEXT DEFAULT 'Agra',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "patients_mobile_idx" ON "patients"("mobile");

-- 4. Create Doctors Table
CREATE TABLE IF NOT EXISTS "doctors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "qualifications" TEXT NOT NULL,
    "experienceYears" INTEGER NOT NULL DEFAULT 34,
    "opdTimings" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Services Table
CREATE TABLE IF NOT EXISTS "services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "category" TEXT NOT NULL,
    "shortDesc" TEXT NOT NULL,
    "fullDesc" TEXT NOT NULL,
    "iconName" TEXT NOT NULL DEFAULT 'Stethoscope',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Appointments Table with Unique Idempotency Key
CREATE TABLE IF NOT EXISTS "appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference" TEXT NOT NULL UNIQUE,
    "idempotencyKey" TEXT UNIQUE,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "serviceId" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3) NOT NULL,
    "preferredTimeSlot" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "symptomsOrNotes" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_appointments_patient" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_appointments_doctor" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE SET NULL,
    CONSTRAINT "fk_appointments_service" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "appointments_reference_idx" ON "appointments"("reference");
CREATE INDEX IF NOT EXISTS "appointments_preferredDate_idx" ON "appointments"("preferredDate");
CREATE INDEX IF NOT EXISTS "appointments_status_idx" ON "appointments"("status");
CREATE INDEX IF NOT EXISTS "appointments_idempotency_idx" ON "appointments"("idempotencyKey");

-- 7. Create Appointment Status History Table
CREATE TABLE IF NOT EXISTS "appointment_status_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT NOT NULL,
    "previousStatus" "AppointmentStatus" NOT NULL,
    "newStatus" "AppointmentStatus" NOT NULL,
    "changedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_status_history_appointment" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE,
    CONSTRAINT "fk_status_history_admin" FOREIGN KEY ("changedById") REFERENCES "admin_users"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "status_history_appointmentId_idx" ON "appointment_status_history"("appointmentId");

-- 8. Create Notifications Ledger Table
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipientType" TEXT NOT NULL,
    "recipientContact" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "notifications_recipient_idx" ON "notifications"("recipientContact");

-- 9. Create Hospital Settings Table
CREATE TABLE IF NOT EXISTS "hospital_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL UNIQUE,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fk_audit_logs_user" FOREIGN KEY ("userId") REFERENCES "admin_users"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
