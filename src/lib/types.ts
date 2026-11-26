export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'RECEPTIONIST';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'COMPLETED';

export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  fullName: string;
  mobile: string;
  email?: string | null;
  city?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  department: string;
  qualifications: string;
  experienceYears: number;
  opdTimings: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  shortDesc: string;
  fullDesc: string;
  iconName: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  reference: string;
  patientId: string;
  doctorId?: string | null;
  serviceId: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTimeSlot: string;
  status: AppointmentStatus;
  symptomsOrNotes?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  // Hydrated joins
  patient?: Patient;
  doctor?: Doctor | null;
  service?: Service;
}

export interface AppointmentStatusHistory {
  id: string;
  appointmentId: string;
  previousStatus: AppointmentStatus;
  newStatus: AppointmentStatus;
  changedById?: string | null;
  changedByName?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  recipientType: 'PATIENT' | 'CLINIC_STAFF';
  recipientContact: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP';
  templateName: string;
  subject: string;
  payloadJson: string;
  status: 'SENT' | 'PENDING' | 'FAILED';
  sentAt: string;
  createdAt: string;
}

export interface HospitalSetting {
  id: string;
  key: string;
  value: string;
  description?: string | null;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: Record<string, any>;
}
