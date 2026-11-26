import { z } from 'zod';

// Indian 10-digit mobile number starting with 6-9
export const indianMobileRegex = /^[6-9]\d{9}$/;

export const createAppointmentSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be under 100 characters')
    .trim(),
  mobile: z
    .string()
    .trim()
    .regex(indianMobileRegex, 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  serviceId: z
    .string()
    .min(1, 'Please select a healthcare service'),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Preferred date must be in YYYY-MM-DD format')
    .refine((val) => {
      const today = new Date().toISOString().split('T')[0];
      return val >= today;
    }, 'Appointment date cannot be in the past'),
  preferredTimeSlot: z
    .string()
    .min(1, 'Please select a preferred time slot'),
  symptomsOrNotes: z
    .string()
    .max(500, 'Notes must be under 500 characters')
    .optional()
    .or(z.literal('')),
  idempotencyKey: z
    .string()
    .max(100)
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid administrative email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'REJECTED', 'COMPLETED']),
  notes: z.string().max(500).optional(),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  preferredTimeSlot: z.string().min(1).optional(),
});
