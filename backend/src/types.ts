export interface ToothStatus {
  toothNumber: number;
  status: "healthy" | "problem" | "treating" | "treated" | "missing";
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  isChild: boolean;
  address?: string;
  notes?: string;
  teeth: ToothStatus[];
  services: string[];
  balance: number;
  clinicId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  defaultPrice: number;
  clinicId: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization?: string;
  email?: string;
  phone?: string;
  color: string;
  clinicId: string;
  userId?: string;
}

export interface Payment {
  id: string;
  visitId: string;
  amount: number;
  date: string;
  method?: "cash" | "ewallet";
}

export interface VisitService {
  serviceId: string;
  quantity: number;
  teeth?: number[];
}

export interface Visit {
  id: string;
  patientId: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  services: string[] | VisitService[];
  cost: number;
  notes?: string;
  status: "scheduled" | "completed" | "cancelled";
  payments: Payment[];
  treatedTeeth?: number[];
  clinicId: string;
  createdAt: string;
  cashAmount?: number;
  ewalletAmount?: number;
}

export interface PatientFile {
  id: string;
  patientId: string;
  name: string;
  file: string;
  clinicId: string;
  uploadedAt: string;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  clinicId: string;
  proficiency?: string;
  role: "admin" | "user";
  createdAt: string;
}

export interface Clinic {
  id: string;
  name: string;
  createdAt: string;
}

export type EntityWithClinic<T extends { clinicId?: string }> = T & { clinicId?: string };

export type EntityId = { id: string };

