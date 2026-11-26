import type { AppointmentStatus } from '../types';

export class StatusTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StatusTransitionError';
  }
}

export class ConcurrencyConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConcurrencyConflictError';
  }
}

export const VALID_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ['CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'REJECTED'],
  CONFIRMED: ['RESCHEDULED', 'COMPLETED', 'CANCELLED'],
  RESCHEDULED: ['CONFIRMED', 'COMPLETED', 'CANCELLED'],
  CANCELLED: ['PENDING'],
  REJECTED: ['PENDING'],
  COMPLETED: [],
};

export function generateAppointmentReference(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Unambiguous alphanumeric characters
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WFH-AGRA-${rand}`;
}
