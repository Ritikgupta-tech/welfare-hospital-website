import type { PrismaClient } from '@prisma/client';
import type {
  AdminUser,
  Appointment,
  AppointmentStatus,
  AuditLog,
  Doctor,
  HospitalSetting,
  NotificationRecord,
  Patient,
  Service,
} from '../types';
import {
  ConcurrencyConflictError,
  StatusTransitionError,
  VALID_STATUS_TRANSITIONS,
  generateAppointmentReference,
} from './common';

export function mapPrismaDoctor(d: any): Doctor {
  return {
    id: d.id,
    name: d.name,
    title: d.title,
    department: d.department,
    qualifications: d.qualifications,
    experienceYears: d.experienceYears ?? 34,
    opdTimings: d.opdTimings,
    isPublished: d.isPublished ?? true,
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt),
    updatedAt: d.updatedAt instanceof Date ? d.updatedAt.toISOString() : String(d.updatedAt),
  };
}

export function mapPrismaService(s: any): Service {
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    category: s.category,
    shortDesc: s.shortDesc,
    fullDesc: s.fullDesc,
    iconName: s.iconName ?? 'Stethoscope',
    isPublished: s.isPublished ?? true,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : String(s.createdAt),
    updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : String(s.updatedAt),
  };
}

export function mapPrismaPatient(p: any): Patient {
  return {
    id: p.id,
    fullName: p.fullName,
    mobile: p.mobile,
    email: p.email,
    city: p.city ?? 'Agra',
    notes: p.notes,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
  };
}

export function mapPrismaAppointment(a: any): Appointment {
  return {
    id: a.id,
    reference: a.reference,
    idempotencyKey: a.idempotencyKey,
    patientId: a.patientId,
    doctorId: a.doctorId,
    serviceId: a.serviceId,
    preferredDate:
      a.preferredDate instanceof Date
        ? a.preferredDate.toISOString().split('T')[0]
        : String(a.preferredDate).split('T')[0],
    preferredTimeSlot: a.preferredTimeSlot,
    status: a.status as AppointmentStatus,
    symptomsOrNotes: a.symptomsOrNotes,
    adminNotes: a.adminNotes,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
    updatedAt: a.updatedAt instanceof Date ? a.updatedAt.toISOString() : String(a.updatedAt),
    patient: a.patient ? mapPrismaPatient(a.patient) : undefined,
    service: a.service ? mapPrismaService(a.service) : undefined,
    doctor: a.doctor ? mapPrismaDoctor(a.doctor) : null,
  };
}

export async function prismaGetServices(prisma: PrismaClient): Promise<Service[]> {
  const services = await prisma.service.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'asc' },
  });
  return services.map(mapPrismaService);
}

export async function prismaFindServiceById(prisma: PrismaClient, idOrSlug: string): Promise<Service | undefined> {
  if (!idOrSlug) return undefined;
  const clean = idOrSlug.trim();
  const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const service = await prisma.service.findFirst({
    where: {
      OR: [
        { id: clean },
        { slug: clean.toLowerCase() },
        { slug: slug },
        { name: { equals: clean, mode: 'insensitive' } },
      ],
    },
  });

  return service ? mapPrismaService(service) : undefined;
}

export async function prismaGetDoctors(prisma: PrismaClient): Promise<Doctor[]> {
  const doctors = await prisma.doctor.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'asc' },
  });
  return doctors.map(mapPrismaDoctor);
}

export async function prismaFindDoctorById(prisma: PrismaClient, id: string): Promise<Doctor | undefined> {
  const doc = await prisma.doctor.findUnique({ where: { id } });
  return doc ? mapPrismaDoctor(doc) : undefined;
}

export async function prismaFindAdminByEmail(prisma: PrismaClient, email: string): Promise<AdminUser | undefined> {
  const admin = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!admin) return undefined;

  return {
    id: admin.id,
    email: admin.email,
    passwordHash: admin.passwordHash,
    name: admin.name,
    role: admin.role as any,
    isActive: admin.isActive,
    lastLoginAt: admin.lastLoginAt ? admin.lastLoginAt.toISOString() : null,
    createdAt: admin.createdAt.toISOString(),
    updatedAt: admin.updatedAt.toISOString(),
  };
}

export async function prismaUpdateAdminLastLogin(prisma: PrismaClient, userId: string): Promise<void> {
  await prisma.adminUser.update({
    where: { id: userId },
    data: { lastLoginAt: new Date(), updatedAt: new Date() },
  });
}

export async function prismaCreateAppointment(
  prisma: PrismaClient,
  data: {
    fullName: string;
    mobile: string;
    email?: string | null;
    serviceId: string;
    preferredDate: string;
    preferredTimeSlot: string;
    symptomsOrNotes?: string | null;
    idempotencyKey?: string | null;
  }
): Promise<Appointment & { isIdempotentReplay?: boolean }> {
  // 1. Idempotency replay check
  if (data.idempotencyKey) {
    const existing = await prisma.appointment.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
      include: { patient: true, doctor: true, service: true },
    });
    if (existing) {
      return {
        ...mapPrismaAppointment(existing),
        isIdempotentReplay: true,
      };
    }
  }

  // 2. Resolve service & doctor
  let service = await prismaFindServiceById(prisma, data.serviceId);
  if (!service) {
    const firstService = await prisma.service.findFirst({ where: { isPublished: true } });
    if (firstService) service = mapPrismaService(firstService);
  }
  const defaultDoc = await prisma.doctor.findFirst({ where: { isPublished: true } });

  // 3. Upsert patient by mobile
  const patient = await prisma.patient.upsert({
    where: { mobile: data.mobile },
    update: {
      fullName: data.fullName,
      email: data.email || undefined,
      updatedAt: new Date(),
    },
    create: {
      fullName: data.fullName,
      mobile: data.mobile,
      email: data.email || null,
      city: 'Agra',
    },
  });

  // 4. Double-click prevention (rapid duplicate check within 60s)
  if (!data.idempotencyKey && service) {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const existingRapid = await prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        serviceId: service.id,
        preferredDate: new Date(data.preferredDate),
        preferredTimeSlot: data.preferredTimeSlot,
        status: 'PENDING',
        createdAt: { gte: oneMinuteAgo },
      },
      include: { patient: true, doctor: true, service: true },
    });
    if (existingRapid) {
      return {
        ...mapPrismaAppointment(existingRapid),
        isIdempotentReplay: true,
      };
    }
  }

  // 5. Generate collision-free reference
  let ref = generateAppointmentReference();
  let collision = await prisma.appointment.findUnique({ where: { reference: ref } });
  while (collision) {
    ref = generateAppointmentReference();
    collision = await prisma.appointment.findUnique({ where: { reference: ref } });
  }

  // 6. Create appointment and status history
  const appointment = await prisma.appointment.create({
    data: {
      reference: ref,
      idempotencyKey: data.idempotencyKey || null,
      patientId: patient.id,
      doctorId: defaultDoc?.id || null,
      serviceId: service?.id || 'srv_primary_001',
      preferredDate: new Date(data.preferredDate),
      preferredTimeSlot: data.preferredTimeSlot,
      status: 'PENDING',
      symptomsOrNotes: data.symptomsOrNotes || null,
      statusHistory: {
        create: {
          previousStatus: 'PENDING',
          newStatus: 'PENDING',
          changedByName: 'Patient Form Submission',
          notes: 'Initial request submitted by patient online.',
        },
      },
    },
    include: {
      patient: true,
      doctor: true,
      service: true,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      action: 'APPOINTMENT_CREATED',
      entityType: 'APPOINTMENT',
      entityId: appointment.id,
      details: `New appointment requested by ${patient.fullName} (${appointment.reference})`,
    },
  }).catch(() => {});

  return mapPrismaAppointment(appointment);
}

export async function prismaFindAppointmentByReference(
  prisma: PrismaClient,
  reference: string
): Promise<Appointment | null> {
  const cleanRef = reference.trim().toUpperCase();
  const apt = await prisma.appointment.findUnique({
    where: { reference: cleanRef },
    include: { patient: true, doctor: true, service: true },
  });
  if (!apt) return null;

  const mapped = mapPrismaAppointment(apt);
  if (mapped.patient) {
    mapped.patient = {
      ...mapped.patient,
      fullName: maskName(mapped.patient.fullName),
      mobile: maskMobile(mapped.patient.mobile),
      email: mapped.patient.email ? maskEmail(mapped.patient.email) : null,
    };
  }
  return mapped;
}

export async function prismaListAppointments(
  prisma: PrismaClient,
  filters: {
    status?: AppointmentStatus | 'ALL';
    search?: string;
    date?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ appointments: Appointment[]; total: number; page: number; totalPages: number }> {
  const where: any = {};

  if (filters.status && filters.status !== 'ALL') {
    where.status = filters.status;
  }

  if (filters.date) {
    where.preferredDate = new Date(filters.date);
  }

  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { reference: { contains: q, mode: 'insensitive' } },
      { patient: { fullName: { contains: q, mode: 'insensitive' } } },
      { patient: { mobile: { contains: q } } },
      { service: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const page = Math.max(1, filters.page || 1);
  const limit = Math.max(1, Math.min(100, filters.limit || 20));
  const skip = (page - 1) * limit;

  const [total, items] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { patient: true, doctor: true, service: true },
    }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;
  return {
    appointments: items.map(mapPrismaAppointment),
    total,
    page,
    totalPages,
  };
}

export async function prismaGetAppointmentById(prisma: PrismaClient, id: string): Promise<Appointment | null> {
  const apt = await prisma.appointment.findFirst({
    where: {
      OR: [{ id }, { reference: id }],
    },
    include: { patient: true, doctor: true, service: true },
  });
  return apt ? mapPrismaAppointment(apt) : null;
}

export async function prismaUpdateAppointmentStatus(
  prisma: PrismaClient,
  id: string,
  newStatus: AppointmentStatus,
  adminUser?: { id: string; name: string },
  notes?: string | null,
  newSchedule?: { preferredDate?: string; preferredTimeSlot?: string },
  expectedUpdatedAt?: string
): Promise<Appointment | null> {
  const apt = await prisma.appointment.findFirst({
    where: { OR: [{ id }, { reference: id }] },
  });
  if (!apt) return null;

  // Concurrency check
  if (expectedUpdatedAt && apt.updatedAt.toISOString() !== expectedUpdatedAt) {
    throw new ConcurrencyConflictError(
      'This appointment was modified by another staff member. Please refresh and review latest changes.'
    );
  }

  const prevStatus = apt.status as AppointmentStatus;

  // Validate state transition
  if (newStatus !== prevStatus) {
    const allowed = VALID_STATUS_TRANSITIONS[prevStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new StatusTransitionError(
        `Invalid status transition: cannot change appointment from ${prevStatus} to ${newStatus}.`
      );
    }
  }

  let rescheduleDetails = '';
  const updateData: any = {
    status: newStatus,
    updatedAt: new Date(),
  };
  if (notes) updateData.adminNotes = notes;

  if (newStatus === 'RESCHEDULED' && newSchedule) {
    if (newSchedule.preferredDate) {
      updateData.preferredDate = new Date(newSchedule.preferredDate);
      rescheduleDetails += ` Date moved to ${newSchedule.preferredDate}.`;
    }
    if (newSchedule.preferredTimeSlot) {
      updateData.preferredTimeSlot = newSchedule.preferredTimeSlot;
      rescheduleDetails += ` Slot moved to "${newSchedule.preferredTimeSlot}".`;
    }
  }

  const updated = await prisma.appointment.update({
    where: { id: apt.id },
    data: {
      ...updateData,
      statusHistory: {
        create: {
          previousStatus: prevStatus,
          newStatus,
          changedById: adminUser?.id || null,
          changedByName: adminUser?.name || 'Administrator',
          notes: (notes || `Status updated from ${prevStatus} to ${newStatus}`) + rescheduleDetails,
        },
      },
    },
    include: { patient: true, doctor: true, service: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUser?.id || null,
      userEmail: adminUser?.name || null,
      action: 'APPOINTMENT_STATUS_UPDATE',
      entityType: 'APPOINTMENT',
      entityId: apt.id,
      details: `Updated ${apt.reference} from ${prevStatus} to ${newStatus}.${rescheduleDetails}`,
    },
  }).catch(() => {});

  return mapPrismaAppointment(updated);
}

export async function prismaUpdateAdminPassword(
  prisma: PrismaClient,
  userId: string,
  newPasswordHash: string
): Promise<boolean> {
  const user = await prisma.adminUser.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash, updatedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      userEmail: user.email,
      action: 'ADMIN_PASSWORD_ROTATED',
      entityType: 'ADMIN_USER',
      entityId: user.id,
      details: `Password securely rotated for administrative user ${user.email}`,
    },
  }).catch(() => {});

  return true;
}

export async function prismaGetDashboardMetrics(prisma: PrismaClient) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    cancelledAppointments,
    completedAppointments,
    todayAppointments,
    recentAppointments,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: 'PENDING' } }),
    prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
    prisma.appointment.count({ where: { status: { in: ['CANCELLED', 'REJECTED'] } } }),
    prisma.appointment.count({ where: { status: 'COMPLETED' } }),
    prisma.appointment.count({
      where: { preferredDate: { gte: today, lt: tomorrow } },
    }),
    prisma.appointment.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { patient: true, service: true },
    }),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    cancelledAppointments,
    completedAppointments,
    todayAppointments,
    recentAppointments: recentAppointments.map(mapPrismaAppointment),
    recentAuditLogs: recentAuditLogs.map((l) => ({
      id: l.id,
      userId: l.userId,
      userEmail: l.userEmail,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      details: l.details,
      createdAt: l.createdAt.toISOString(),
    })),
  };
}

function maskName(name: string): string {
  const parts = name.trim().split(' ');
  return parts.map((p) => (p.length > 2 ? p[0] + '*'.repeat(p.length - 2) + p[p.length - 1] : p[0] + '*')).join(' ');
}

function maskMobile(mobile: string): string {
  if (mobile.length !== 10) return mobile;
  return mobile.substring(0, 2) + '******' + mobile.substring(8);
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return '***@***.com';
  return user.charAt(0) + '***@' + domain;
}
