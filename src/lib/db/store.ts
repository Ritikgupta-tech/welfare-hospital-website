import fs from 'node:fs';
import path from 'node:path';
import type {
  AdminUser,
  Appointment,
  AppointmentStatus,
  AppointmentStatusHistory,
  AuditLog,
  Doctor,
  HospitalSetting,
  NotificationRecord,
  Patient,
  Service,
} from '../types';
import { hashPassword } from '../auth/password';

interface DatabaseData {
  adminUsers: AdminUser[];
  patients: Patient[];
  doctors: Doctor[];
  services: Service[];
  appointments: Appointment[];
  statusHistories: AppointmentStatusHistory[];
  notifications: NotificationRecord[];
  settings: HospitalSetting[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'hospital_db.json');

// In-memory cache + persistent JSON file for resilient execution
let cachedData: DatabaseData | null = null;

function ensureDataDirectory(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    // Ignore in read-only environments
  }
}

function loadData(): DatabaseData {
  if (cachedData) return cachedData;
  ensureDataDirectory();

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      cachedData = JSON.parse(raw);
      if (cachedData) {
        cachedData.adminUsers = cachedData.adminUsers || [];
        // Ensure super admin has valid hash for WelfareHospital@2026
        const admin = cachedData.adminUsers.find((u) => u.email === 'admin@welfarehospital.com');
        if (admin && !admin.passwordHash.startsWith('$2b$10$IKaAHa')) {
          admin.passwordHash = '$2b$10$IKaAHa/mbmGmzKzxt4m8Ku4rNS9C3VsIRiKeDtRtahpWnNnm8ACjq';
        }
        cachedData.patients = cachedData.patients || [];
        cachedData.doctors = cachedData.doctors || [];
        cachedData.services = cachedData.services || [];
        cachedData.appointments = cachedData.appointments || [];
        cachedData.statusHistories = cachedData.statusHistories || [];
        cachedData.notifications = cachedData.notifications || [];
        cachedData.settings = cachedData.settings || [];
        cachedData.auditLogs = cachedData.auditLogs || [];
      }
      return cachedData!;
    }
  } catch (err) {
    console.warn('[DB] Could not read disk store, initializing default in-memory store:', err);
  }

  // Initial Seed
  cachedData = createSeedData();
  saveData(cachedData);
  return cachedData;
}

function saveData(data: DatabaseData): void {
  cachedData = data;
  try {
    ensureDataDirectory();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // In serverless / read-only environment, keep in-memory
  }
}

function createSeedData(): DatabaseData {
  const now = new Date().toISOString();
  // Pre-hashed for WelfareHospital@2026
  const defaultAdminHash = '$2b$10$IKaAHa/mbmGmzKzxt4m8Ku4rNS9C3VsIRiKeDtRtahpWnNnm8ACjq';

  const defaultAdmin: AdminUser = {
    id: 'usr_admin_001',
    email: 'admin@welfarehospital.com',
    passwordHash: defaultAdminHash,
    name: 'Hospital Administrator',
    role: 'SUPER_ADMIN',
    isActive: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const defaultDoctor: Doctor = {
    id: 'doc_lead_001',
    name: 'Dr. Opee Rajput',
    title: 'Hospital Owner & Supervising Physician',
    department: 'General Medicine',
    qualifications: 'General Medicine & Family Practice',
    experienceYears: 34,
    opdTimings: 'Monday – Saturday: Morning (10:00 AM - 01:00 PM) & Evening (05:00 PM - 08:00 PM)',
    isPublished: true,
    createdAt: now,
    updatedAt: now,
  };

  const defaultServices: Service[] = [
    {
      id: 'srv_primary_001',
      name: 'Primary Healthcare',
      slug: 'primary-healthcare',
      category: 'Primary Healthcare',
      shortDesc: 'First-contact clinical evaluation, vital signs assessment, and treatment for everyday illnesses.',
      fullDesc: 'Comprehensive general outpatient consultations addressing common infections, fevers, seasonal illness, respiratory complaints, and preventive family health.',
      iconName: 'HeartPulse',
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'srv_physician_002',
      name: 'Physician Consultations',
      slug: 'physician-consultations',
      category: 'Physician Consultation',
      shortDesc: 'Focused clinical diagnosis, blood pressure evaluations, and personalized medical guidance by Dr. Opee Rajput.',
      fullDesc: 'In-depth physician consultation focusing on accurate diagnosis, personalized medical advice, medication review, and diagnostic prescription.',
      iconName: 'Stethoscope',
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'srv_healthcheck_003',
      name: 'Routine Health Checks',
      slug: 'routine-health-checks',
      category: 'Routine Health Check',
      shortDesc: 'Baseline physical health examinations, blood pressure monitoring, and health screenings.',
      fullDesc: 'Systematic health checkups to identify early warning signs of chronic conditions, lifestyle risks, and nutritional deficiencies.',
      iconName: 'Activity',
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'srv_continuing_004',
      name: 'Continuing Care Management',
      slug: 'continuing-care',
      category: 'Continuing Care',
      shortDesc: 'Long-term monitoring, follow-up assessments, and chronic condition management for Agra families.',
      fullDesc: 'Longitudinal follow-up care for managing hypertension, diabetes, seasonal allergies, and post-illness recovery in a caring outpatient setting.',
      iconName: 'ShieldCheck',
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const defaultSettings: HospitalSetting[] = [
    { id: 'set_1', key: 'hospital_name', value: 'Welfare Hospital', description: 'Institution Name', updatedAt: now },
    { id: 'set_2', key: 'phone', value: '+91 8490068558', description: 'Primary Contact Number', updatedAt: now },
    { id: 'set_3', key: 'address', value: '100 Feet Road, Ram Bagh, Agra, UP', description: 'Physical Location', updatedAt: now },
    { id: 'set_4', key: 'lead_physician', value: 'Dr. Opee Rajput', description: 'Lead Doctor', updatedAt: now },
    { id: 'set_5', key: 'opd_hours', value: 'Mon - Sat: 10:00 AM - 1:00 PM & 5:00 PM - 8:00 PM', description: 'Consultation Hours', updatedAt: now },
  ];

  return {
    adminUsers: [defaultAdmin],
    patients: [],
    doctors: [defaultDoctor],
    services: defaultServices,
    appointments: [],
    statusHistories: [],
    notifications: [],
    settings: defaultSettings,
    auditLogs: [],
  };
}

// ---------------- Repository Methods ---------------- //

export async function getServices(): Promise<Service[]> {
  const db = loadData();
  return db.services.filter((s) => s.isPublished);
}

export async function findServiceById(id: string): Promise<Service | undefined> {
  const db = loadData();
  return db.services.find((s) => s.id === id || s.slug === id);
}

export async function getDoctors(): Promise<Doctor[]> {
  const db = loadData();
  return db.doctors.filter((d) => d.isPublished);
}

export async function findDoctorById(id: string): Promise<Doctor | undefined> {
  const db = loadData();
  return db.doctors.find((d) => d.id === id);
}

export async function findAdminByEmail(email: string): Promise<AdminUser | undefined> {
  const db = loadData();
  return db.adminUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function updateAdminLastLogin(userId: string): Promise<void> {
  const db = loadData();
  const user = db.adminUsers.find((u) => u.id === userId);
  if (user) {
    user.lastLoginAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    saveData(db);
  }
}

export function generateAppointmentReference(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Unambiguous chars
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WFH-AGRA-${rand}`;
}

export async function createAppointment(data: {
  fullName: string;
  mobile: string;
  email?: string | null;
  serviceId: string;
  preferredDate: string;
  preferredTimeSlot: string;
  symptomsOrNotes?: string | null;
}): Promise<Appointment> {
  const db = loadData();
  const now = new Date().toISOString();

  // Find or create patient
  let patient = db.patients.find((p) => p.mobile === data.mobile);
  if (!patient) {
    patient = {
      id: `pat_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      fullName: data.fullName,
      mobile: data.mobile,
      email: data.email || null,
      city: 'Agra',
      notes: null,
      createdAt: now,
      updatedAt: now,
    };
    db.patients.push(patient);
  } else {
    // Update name/email if provided
    patient.fullName = data.fullName;
    if (data.email) patient.email = data.email;
    patient.updatedAt = now;
  }

  // Verify service
  const service = db.services.find((s) => s.id === data.serviceId || s.slug === data.serviceId) || db.services[0];
  const doctor = db.doctors[0]; // Dr. Opee Rajput

  // Generate unique reference
  let ref = generateAppointmentReference();
  while (db.appointments.some((a) => a.reference === ref)) {
    ref = generateAppointmentReference();
  }

  const appointment: Appointment = {
    id: `apt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    reference: ref,
    patientId: patient.id,
    doctorId: doctor?.id || null,
    serviceId: service.id,
    preferredDate: data.preferredDate,
    preferredTimeSlot: data.preferredTimeSlot,
    status: 'PENDING',
    symptomsOrNotes: data.symptomsOrNotes || null,
    adminNotes: null,
    createdAt: now,
    updatedAt: now,
  };

  db.appointments.unshift(appointment);

  // Initial status history log
  const history: AppointmentStatusHistory = {
    id: `hist_${Date.now()}`,
    appointmentId: appointment.id,
    previousStatus: 'PENDING',
    newStatus: 'PENDING',
    changedById: null,
    changedByName: 'Patient Form Submission',
    notes: 'Initial request submitted by patient online.',
    createdAt: now,
  };
  db.statusHistories.push(history);

  // Audit Log
  db.auditLogs.unshift({
    id: `aud_${Date.now()}`,
    userId: null,
    userEmail: null,
    action: 'APPOINTMENT_CREATED',
    entityType: 'APPOINTMENT',
    entityId: appointment.id,
    details: `New appointment requested by ${patient.fullName} (${appointment.reference})`,
    createdAt: now,
  });

  saveData(db);

  // Return with hydrated fields
  return {
    ...appointment,
    patient,
    service,
    doctor,
  };
}

export async function findAppointmentByReference(reference: string): Promise<Appointment | null> {
  const db = loadData();
  const cleanRef = reference.trim().toUpperCase();
  const apt = db.appointments.find((a) => a.reference === cleanRef);
  if (!apt) return null;

  const patient = db.patients.find((p) => p.id === apt.patientId);
  const service = db.services.find((s) => s.id === apt.serviceId);
  const doctor = db.doctors.find((d) => d.id === apt.doctorId);

  return {
    ...apt,
    patient: patient
      ? {
          ...patient,
          // Mask sensitive details for public lookup
          fullName: maskName(patient.fullName),
          mobile: maskMobile(patient.mobile),
          email: patient.email ? maskEmail(patient.email) : null,
        }
      : undefined,
    service,
    doctor,
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

export async function listAppointments(filters: {
  status?: AppointmentStatus | 'ALL';
  search?: string;
  date?: string;
  page?: number;
  limit?: number;
}): Promise<{ appointments: Appointment[]; total: number; page: number; totalPages: number }> {
  const db = loadData();
  let list = [...db.appointments];

  if (filters.status && filters.status !== 'ALL') {
    list = list.filter((a) => a.status === filters.status);
  }

  if (filters.date) {
    list = list.filter((a) => a.preferredDate === filters.date);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter((a) => {
      const patient = db.patients.find((p) => p.id === a.patientId);
      const service = db.services.find((s) => s.id === a.serviceId);
      return (
        a.reference.toLowerCase().includes(q) ||
        (patient && patient.fullName.toLowerCase().includes(q)) ||
        (patient && patient.mobile.includes(q)) ||
        (service && service.name.toLowerCase().includes(q))
      );
    });
  }

  const total = list.length;
  const page = Math.max(1, filters.page || 1);
  const limit = Math.max(1, Math.min(100, filters.limit || 20));
  const totalPages = Math.ceil(total / limit) || 1;
  const offset = (page - 1) * limit;

  const paginated = list.slice(offset, offset + limit).map((apt) => ({
    ...apt,
    patient: db.patients.find((p) => p.id === apt.patientId),
    service: db.services.find((s) => s.id === apt.serviceId),
    doctor: db.doctors.find((d) => d.id === apt.doctorId),
  }));

  return { appointments: paginated, total, page, totalPages };
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  const db = loadData();
  const apt = db.appointments.find((a) => a.id === id || a.reference === id);
  if (!apt) return null;

  return {
    ...apt,
    patient: db.patients.find((p) => p.id === apt.patientId),
    service: db.services.find((s) => s.id === apt.serviceId),
    doctor: db.doctors.find((d) => d.id === apt.doctorId),
  };
}

export async function updateAppointmentStatus(
  id: string,
  newStatus: AppointmentStatus,
  adminUser?: { id: string; name: string },
  notes?: string | null
): Promise<Appointment | null> {
  const db = loadData();
  const apt = db.appointments.find((a) => a.id === id || a.reference === id);
  if (!apt) return null;

  const now = new Date().toISOString();
  const prevStatus = apt.status;
  apt.status = newStatus;
  if (notes) apt.adminNotes = notes;
  apt.updatedAt = now;

  // Add history
  db.statusHistories.push({
    id: `hist_${Date.now()}`,
    appointmentId: apt.id,
    previousStatus: prevStatus,
    newStatus,
    changedById: adminUser?.id || null,
    changedByName: adminUser?.name || 'Administrator',
    notes: notes || `Status updated from ${prevStatus} to ${newStatus}`,
    createdAt: now,
  });

  // Add audit log
  db.auditLogs.unshift({
    id: `aud_${Date.now()}`,
    userId: adminUser?.id || null,
    userEmail: adminUser?.name || null,
    action: 'APPOINTMENT_STATUS_UPDATE',
    entityType: 'APPOINTMENT',
    entityId: apt.id,
    details: `Updated ${apt.reference} from ${prevStatus} to ${newStatus}`,
    createdAt: now,
  });

  saveData(db);

  return {
    ...apt,
    patient: db.patients.find((p) => p.id === apt.patientId),
    service: db.services.find((s) => s.id === apt.serviceId),
    doctor: db.doctors.find((d) => d.id === apt.doctorId),
  };
}

export async function getDashboardMetrics(): Promise<{
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  cancelledAppointments: number;
  completedAppointments: number;
  todayAppointments: number;
  recentAppointments: Appointment[];
  recentAuditLogs: AuditLog[];
}> {
  const db = loadData();
  const today = new Date().toISOString().split('T')[0];

  const totalAppointments = db.appointments.length;
  const pendingAppointments = db.appointments.filter((a) => a.status === 'PENDING').length;
  const confirmedAppointments = db.appointments.filter((a) => a.status === 'CONFIRMED').length;
  const cancelledAppointments = db.appointments.filter((a) => a.status === 'CANCELLED' || a.status === 'REJECTED').length;
  const completedAppointments = db.appointments.filter((a) => a.status === 'COMPLETED').length;
  const todayAppointments = db.appointments.filter((a) => a.preferredDate === today).length;

  const recentAppointments = db.appointments.slice(0, 6).map((apt) => ({
    ...apt,
    patient: db.patients.find((p) => p.id === apt.patientId),
    service: db.services.find((s) => s.id === apt.serviceId),
  }));

  const recentAuditLogs = db.auditLogs.slice(0, 8);

  return {
    totalAppointments,
    pendingAppointments,
    confirmedAppointments,
    cancelledAppointments,
    completedAppointments,
    todayAppointments,
    recentAppointments,
    recentAuditLogs,
  };
}

export async function listPatients(): Promise<Patient[]> {
  const db = loadData();
  return db.patients;
}

export async function listAuditLogs(): Promise<AuditLog[]> {
  const db = loadData();
  return db.auditLogs.slice(0, 100);
}

export async function recordNotification(data: {
  recipientType: 'PATIENT' | 'CLINIC_STAFF';
  recipientContact: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP';
  templateName: string;
  subject: string;
  payloadJson?: string;
  status?: 'SENT' | 'PENDING' | 'FAILED';
}): Promise<NotificationRecord> {
  const db = loadData();
  const now = new Date().toISOString();
  const notif: NotificationRecord = {
    id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    recipientType: data.recipientType,
    recipientContact: data.recipientContact,
    channel: data.channel,
    templateName: data.templateName,
    subject: data.subject,
    payloadJson: data.payloadJson || '{}',
    status: data.status || 'SENT',
    sentAt: now,
    createdAt: now,
  };
  db.notifications.unshift(notif);
  saveData(db);
  return notif;
}

export async function listNotificationsAdmin(): Promise<NotificationRecord[]> {
  const db = loadData();
  return db.notifications.slice(0, 100);
}

// ---------------- Admin Services & Doctors Management ---------------- //

export async function getAllServicesAdmin(): Promise<Service[]> {
  const db = loadData();
  return db.services;
}

export async function createService(data: {
  name: string;
  category: string;
  shortDesc: string;
  fullDesc: string;
  iconName?: string;
  isPublished?: boolean;
}): Promise<Service> {
  const db = loadData();
  const now = new Date().toISOString();
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const newService: Service = {
    id: `srv_${Date.now()}`,
    name: data.name,
    slug: slug || `service-${Date.now()}`,
    category: data.category,
    shortDesc: data.shortDesc,
    fullDesc: data.fullDesc,
    iconName: data.iconName || 'Stethoscope',
    isPublished: data.isPublished !== undefined ? data.isPublished : true,
    createdAt: now,
    updatedAt: now,
  };

  db.services.push(newService);
  saveData(db);
  return newService;
}

export async function updateService(id: string, updates: Partial<Service>): Promise<Service | null> {
  const db = loadData();
  const service = db.services.find((s) => s.id === id);
  if (!service) return null;

  Object.assign(service, updates, { updatedAt: new Date().toISOString() });
  saveData(db);
  return service;
}

export async function getAllDoctorsAdmin(): Promise<Doctor[]> {
  const db = loadData();
  return db.doctors;
}

export async function updateDoctor(id: string, updates: Partial<Doctor>): Promise<Doctor | null> {
  const db = loadData();
  const doctor = db.doctors.find((d) => d.id === id);
  if (!doctor) return null;

  Object.assign(doctor, updates, { updatedAt: new Date().toISOString() });
  saveData(db);
  return doctor;
}

export async function createDoctor(data: {
  name: string;
  title: string;
  department: string;
  qualifications: string;
  experienceYears?: number;
  opdTimings: string;
  isPublished?: boolean;
}): Promise<Doctor> {
  const db = loadData();
  const now = new Date().toISOString();

  const newDoctor: Doctor = {
    id: `doc_${Date.now()}`,
    name: data.name,
    title: data.title,
    department: data.department,
    qualifications: data.qualifications,
    experienceYears: data.experienceYears || 5,
    opdTimings: data.opdTimings,
    isPublished: data.isPublished !== undefined ? data.isPublished : true,
    createdAt: now,
    updatedAt: now,
  };

  db.doctors.push(newDoctor);
  saveData(db);
  return newDoctor;
}
