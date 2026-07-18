import { Platform } from 'react-native';

declare const process:
  | {
      env?: {
        EXPO_PUBLIC_API_URL?: string;
      };
    }
  | undefined;

export const APPOINTMENT_DATE = '2026-08-01';

const configuredApiUrl = typeof process === 'undefined' ? undefined : process.env?.EXPO_PUBLIC_API_URL;

export const API_BASE_URL =
  configuredApiUrl ??
  Platform.select({
    android: 'http://10.0.2.2:8081',
    default: 'http://localhost:8081',
  }) ??
  'http://localhost:8081';

export type ApiHealthResponse = {
  status: string;
  dataMode: string;
  patientCount: number;
  appointmentCount: number;
  scheduleSlotCount: number;
};

export type Doctor = {
  id: string;
  fullName: string;
  specialty?: string;
  clinicName?: string;
  workingDayStart: string;
  workingDayEnd: string;
  slotLengthMinutes: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Patient = {
  id: string;
  doctorId: string;
  fullName: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  historyNotes?: string;
  careNotes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AppointmentStatus = 'BOOKED' | 'COMPLETED' | 'NO_SHOW';

export type Appointment = {
  id: string;
  doctorId: string;
  patientId: string;
  appointmentDate: string;
  slotStart: string;
  slotEnd: string;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ScheduleSlot = {
  start: string;
  end: string;
  available: boolean;
  appointment: Appointment | null;
  patient: Patient | null;
};

export type DayScheduleResponse = {
  doctor: Doctor;
  appointmentDate: string;
  slots: ScheduleSlot[];
};

export type AppointmentSlotUpdateRequest = {
  appointmentDate: string;
  slotStart: string;
  slotEnd: string;
};

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: string;
  headers?: Record<string, string>;
};

type ApiResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
};

export async function getHealth(): Promise<ApiHealthResponse> {
  return apiRequest('/api/health');
}

export async function getPatients(): Promise<Patient[]> {
  return apiRequest('/api/patients');
}

export async function getSchedule(date = APPOINTMENT_DATE): Promise<DayScheduleResponse> {
  return apiRequest(`/api/schedule?date=${encodeURIComponent(date)}`);
}

export async function seedBaselineData(): Promise<ApiHealthResponse> {
  return apiRequest('/api/seed', {
    method: 'POST',
  });
}

export async function moveAppointmentSlot(
  appointmentId: string,
  request: AppointmentSlotUpdateRequest,
): Promise<Appointment> {
  return apiRequest(`/api/appointments/${encodeURIComponent(appointmentId)}/slot`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  });
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response: ApiResponse = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as T;
}

async function getErrorMessage(response: ApiResponse): Promise<string> {
  const fallback = `Request failed with ${response.status}`;
  const body = await response.text();

  if (!body) {
    return fallback;
  }

  try {
    const errorBody = JSON.parse(body) as { message?: string };
    return errorBody.message ?? fallback;
  } catch {
    return body;
  }
}
