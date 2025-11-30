// API-only data store - all data operations go through the backend API
import { apiClient, ApiError } from "./api";

// Types
export interface ToothStatus {
  toothNumber: number;
  status: "healthy" | "problem" | "treating" | "treated" | "missing";
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  dateOfBirth: string; // ISO date string
  isChild: boolean;
  address?: string;
  notes?: string;
  teeth: ToothStatus[];
  services: string[]; // Service IDs
  balance: number; // Outstanding balance
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
  startTime: string; // ISO datetime string
  endTime: string; // ISO datetime string
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
  file: File | string;
  clinicId: string;
  uploadedAt: string;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  phone?: string;
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

export interface Subscription {
  id: string;
  clinicId: string;
  plan: "start" | "growth" | "network";
  period: "monthly" | "yearly";
  startDate: string;
  nextPaymentDate: string;
  isActive: boolean;
  createdAt: string;
  isTrial?: boolean;
  trialEndDate?: string;
}

// Store class - API-only, no localStorage for data
class Store {
  // In-memory cache for optimistic updates (optional, can be removed if not needed)
  private cache: {
    patients: Map<string, Patient>;
    doctors: Map<string, Doctor>;
    services: Map<string, Service>;
    visits: Map<string, Visit>;
    files: Map<string, PatientFile>;
    users: Map<string, User>;
    clinics: Map<string, Clinic>;
  } = {
    patients: new Map(),
    doctors: new Map(),
    services: new Map(),
    visits: new Map(),
    files: new Map(),
    users: new Map(),
    clinics: new Map(),
  };

  private readonly CURRENT_USER_KEY = "biyo_current_user";

  // Helper to get current user's clinic ID
  getCurrentClinicId(): string | null {
    const currentUser = this.getCurrentUser();
    return currentUser?.clinicId || null;
  }

  // Authentication - only thing stored in localStorage
  getCurrentUser(): User | null {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return null;
      }
      const userStr = localStorage.getItem(this.CURRENT_USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.CURRENT_USER_KEY);
    }

    if (typeof window !== "undefined") {
      const detail = user ? { user } : { user: null };
      window.dispatchEvent(new CustomEvent("biyo-auth-changed", { detail }));
    }
  }

  logout(): void {
    this.setCurrentUser(null);
    this.clearCache();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("biyo-data-updated", { detail: { type: "auth" } }));
    }
  }

  private clearCache(): void {
    this.cache = {
      patients: new Map(),
      doctors: new Map(),
      services: new Map(),
      visits: new Map(),
      files: new Map(),
      users: new Map(),
      clinics: new Map(),
    };
  }

  private notifyDataUpdate(type: string): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("biyo-data-updated", { detail: { type } }));
    }
  }

  // Patients
  // Synchronous getter - returns cached data
  getPatients(clinicId?: string): Patient[] {
    const filterClinicId = clinicId || this.getCurrentClinicId();
    const allPatients = Array.from(this.cache.patients.values());
    if (filterClinicId) {
      return allPatients.filter((p) => p.clinicId === filterClinicId);
    }
    return allPatients;
  }

  // Async fetch - fetches from API and updates cache
  async fetchPatients(clinicId?: string): Promise<Patient[]> {
    const filterClinicId = clinicId || this.getCurrentClinicId();
    if (!filterClinicId) {
      throw new Error("No clinic ID available. Please log in.");
    }
    const patients = await apiClient.getPatients(filterClinicId);
    // Update cache
    patients.forEach((p) => this.cache.patients.set(p.id, p));
    this.notifyDataUpdate("patients");
    return patients;
  }

  async savePatient(patient: Patient): Promise<Patient> {
    if (!patient.clinicId) {
      const clinicId = this.getCurrentClinicId();
      if (clinicId) {
        patient.clinicId = clinicId;
      } else {
        throw new Error("No clinic ID available. Please log in.");
      }
    }

    const saved = await apiClient.savePatient(patient);
    this.cache.patients.set(saved.id, saved);
    this.notifyDataUpdate("patients");
    return saved;
  }

  async deletePatient(patientId: string, clinicId?: string): Promise<void> {
    const filterClinicId = clinicId || this.getCurrentClinicId();
    if (!filterClinicId) {
      throw new Error("No clinic ID available. Please log in.");
    }
    await apiClient.deletePatient(patientId, filterClinicId);
    this.cache.patients.delete(patientId);
    this.notifyDataUpdate("patients");
  }

  // Doctors
  getDoctors(clinicId?: string): Doctor[] {
    const filterClinicId = clinicId || this.getCurrentClinicId();
    const allDoctors = Array.from(this.cache.doctors.values());
    if (filterClinicId) {
      return allDoctors.filter((d) => d.clinicId === filterClinicId);
    }
    return allDoctors;
  }

  async fetchDoctors(clinicId?: string): Promise<Doctor[]> {
    const filterClinicId = clinicId || this.getCurrentClinicId();
    if (!filterClinicId) {
      throw new Error("No clinic ID available. Please log in.");
    }
    const doctors = await apiClient.getDoctors(filterClinicId);
    doctors.forEach((d) => this.cache.doctors.set(d.id, d));
    this.notifyDataUpdate("doctors");
    return doctors;
  }

  async saveDoctor(doctor: Doctor): Promise<Doctor> {
    if (!doctor.clinicId) {
      const clinicId = this.getCurrentClinicId();
      if (clinicId) {
        doctor.clinicId = clinicId;
      } else {
        throw new Error("No clinic ID available. Please log in.");
      }
    }

    const saved = await apiClient.saveDoctor(doctor);
    this.cache.doctors.set(saved.id, saved);
    this.notifyDataUpdate("doctors");
    return saved;
  }

  async deleteDoctor(doctorId: string, clinicId?: string): Promise<void> {
    const filterClinicId = clinicId || this.getCurrentClinicId();
    if (!filterClinicId) {
      throw new Error("No clinic ID available. Please log in.");
    }
    await apiClient.deleteDoctor(doctorId, filterClinicId);
    this.cache.doctors.delete(doctorId);
    this.notifyDataUpdate("doctors");
  }

  // Services
  getServices(clinicId?: string): Service[] {
    const filterClinicId = clinicId || this.getCurrentClinicId();
    const allServices = Array.from(this.cache.services.values());
    if (filterClinicId) {
      return allServices.filter((s) => s.clinicId === filterClinicId);
    }
    return allServices;
  }

  async fetchServices(clinicId?: string): Promise<Service[]> {
    const filterClinicId = clinicId || this.getCurrentClinicId();
    if (!filterClinicId) {
      throw new Error("No clinic ID available. Please log in.");
    }
    const services = await apiClient.getServices(filterClinicId);
    services.forEach((s) => this.cache.services.set(s.id, s));
    this.notifyDataUpdate("services");
    return services;
  }

  async saveService(service: Service): Promise<Service> {
    if (!service.clinicId) {
      const clinicId = this.getCurrentClinicId();
      if (clinicId) {
        service.clinicId = clinicId;
      } else {
        throw new Error("No clinic ID available. Please log in.");
      }
    }

    const saved = await apiClient.saveService(service);
    this.cache.services.set(saved.id, saved);
    this.notifyDataUpdate("services");
    return saved;
  }

  async deleteService(serviceId: string, clinicId?: string): Promise<void> {
    const filterClinicId = clinicId || this.getCurrentClinicId();
    if (!filterClinicId) {
      throw new Error("No clinic ID available. Please log in.");
    }
    await apiClient.deleteService(serviceId, filterClinicId);
    this.cache.services.delete(serviceId);
    this.notifyDataUpdate("services");
  }

  // Visits
  getVisits(clinicId?: string): Visit[] {
    const filterClinicId = clinicId || this.getCurrentClinicId();
    const allVisits = Array.from(this.cache.visits.values());
    if (filterClinicId) {
      return allVisits.filter((v) => v.clinicId === filterClinicId);
    }
    return allVisits;
  }

  async fetchVisits(clinicId?: string): Promise<Visit[]> {
    const filterClinicId = clinicId || this.getCurrentClinicId();
    if (!filterClinicId) {
      throw new Error("No clinic ID available. Please log in.");
    }
    const visits = await apiClient.getVisits(filterClinicId);
    visits.forEach((v) => this.cache.visits.set(v.id, v));
    this.notifyDataUpdate("visits");
    return visits;
  }

  async saveVisit(visit: Visit): Promise<Visit> {
    if (!visit.clinicId) {
      const clinicId = this.getCurrentClinicId();
      if (clinicId) {
        visit.clinicId = clinicId;
      } else {
        throw new Error("No clinic ID available. Please log in.");
      }
    }

    const saved = await apiClient.saveVisit(visit);
    this.cache.visits.set(saved.id, saved);
    this.notifyDataUpdate("visits");
    return saved;
  }

  async deleteVisit(visitId: string, clinicId?: string): Promise<void> {
    const filterClinicId = clinicId || this.getCurrentClinicId();
    if (!filterClinicId) {
      throw new Error("No clinic ID available. Please log in.");
    }
    await apiClient.deleteVisit(visitId, filterClinicId);
    this.cache.visits.delete(visitId);
    this.notifyDataUpdate("visits");
  }

  // Payments
  async addPayment(visitId: string, amount: number, method: "cash" | "ewallet"): Promise<Payment> {
    if (amount <= 0 || !Number.isFinite(amount)) {
      throw new Error("Payment amount must be greater than zero");
    }

    const normalizedAmount = parseFloat(Number(amount).toFixed(2));
    const payment = await apiClient.addPayment(visitId, normalizedAmount, method);

    // Refresh visit to get updated payment totals
    const clinicId = this.getCurrentClinicId();
    if (clinicId) {
      await this.fetchVisits(clinicId);
    }

    this.notifyDataUpdate("visits");
    return payment;
  }

  async deletePayment(paymentId: string): Promise<void> {
    await apiClient.deletePayment(paymentId);
    this.notifyDataUpdate("visits");
  }

  // Files
  getFiles(patientId?: string, clinicId?: string): PatientFile[] {
    const filterClinicId = clinicId || this.getCurrentClinicId();
    let allFiles = Array.from(this.cache.files.values());
    if (filterClinicId) {
      allFiles = allFiles.filter((f) => f.clinicId === filterClinicId);
    }
    if (patientId) {
      allFiles = allFiles.filter((f) => f.patientId === patientId);
    }
    return allFiles;
  }

  async fetchFiles(patientId?: string, clinicId?: string): Promise<PatientFile[]> {
    const filterClinicId = clinicId || this.getCurrentClinicId();
    if (!filterClinicId) {
      throw new Error("No clinic ID available. Please log in.");
    }
    const files = await apiClient.getFiles(patientId, filterClinicId);
    files.forEach((f) => this.cache.files.set(f.id, f));
    this.notifyDataUpdate("files");
    return files;
  }

  async saveFile(file: PatientFile): Promise<PatientFile> {
    if (!file.clinicId) {
      const clinicId = this.getCurrentClinicId();
      if (clinicId) {
        file.clinicId = clinicId;
      } else {
        throw new Error("No clinic ID available. Please log in.");
      }
    }

    const saved = await apiClient.saveFile(file);
    this.cache.files.set(saved.id, saved);
    this.notifyDataUpdate("files");
    return saved;
  }

  async deleteFile(fileId: string, clinicId?: string): Promise<void> {
    const filterClinicId = clinicId || this.getCurrentClinicId();
    if (!filterClinicId) {
      throw new Error("No clinic ID available. Please log in.");
    }
    await apiClient.deleteFile(fileId, filterClinicId);
    this.cache.files.delete(fileId);
    this.notifyDataUpdate("files");
  }

  // Users
  getUsers(clinicId?: string): User[] {
    const filterClinicId = clinicId || this.getCurrentClinicId();
    const allUsers = Array.from(this.cache.users.values());
    if (filterClinicId) {
      return allUsers.filter((u) => u.clinicId === filterClinicId);
    }
    return allUsers;
  }

  async fetchUsers(clinicId?: string): Promise<User[]> {
    const filterClinicId = clinicId || this.getCurrentClinicId();
    if (!filterClinicId) {
      throw new Error("No clinic ID available. Please log in.");
    }
    const users = await apiClient.getUsers(filterClinicId);
    users.forEach((u) => this.cache.users.set(u.id, u));
    this.notifyDataUpdate("users");
    return users;
  }

  async saveUser(user: User): Promise<User> {
    const saved = await apiClient.saveUser(user);
    this.cache.users.set(saved.id, saved);
    this.notifyDataUpdate("users");
    return saved;
  }

  getUsersByClinic(clinicId: string): User[] {
    // Return cached users for this clinic (should call getUsers for fresh data)
    return Array.from(this.cache.users.values()).filter((u) => u.clinicId === clinicId);
  }

  // Clinics
  getClinics(): Clinic[] {
    return Array.from(this.cache.clinics.values());
  }

  async fetchClinics(): Promise<Clinic[]> {
    const clinics = await apiClient.getClinics();
    clinics.forEach((c) => this.cache.clinics.set(c.id, c));
    this.notifyDataUpdate("clinics");
    return clinics;
  }

  async saveClinic(clinic: Clinic): Promise<Clinic> {
    const saved = await apiClient.saveClinic(clinic);
    this.cache.clinics.set(saved.id, saved);
    this.notifyDataUpdate("clinics");
    return saved;
  }

  // Calculate patient balance from cached visits
  calculatePatientBalance(patientId: string): number {
    const clinicId = this.getCurrentClinicId();
    if (!clinicId) {
      return 0;
    }

    const visits = this.getVisits(clinicId);
    const patientVisits = visits.filter(
      (v) => v.patientId === patientId && v.status !== "cancelled" && v.clinicId === clinicId,
    );

    const totalCost = patientVisits.reduce((sum, v) => sum + v.cost, 0);
    const totalPaid = patientVisits.reduce(
      (sum, v) => sum + (v.payments?.reduce((p, pay) => p + pay.amount, 0) || 0),
      0,
    );
    return Math.max(0, totalCost - totalPaid);
  }

  // Initialize default services for current clinic
  async initializeDefaultServices(): Promise<void> {
    const clinicId = this.getCurrentClinicId();
    if (!clinicId) {
      return;
    }

    const existingServices = this.getServices(clinicId);
    if (existingServices.length > 0) {
      return; // Services already initialized
    }

    const defaultServices: Omit<Service, "id">[] = [
      // Лечебная стоматология
      { name: "Пломбирование корневых каналов", defaultPrice: 0, clinicId },
      { name: "Пломбирование передних зубов", defaultPrice: 0, clinicId },
      { name: "Пломбирование боковых зубов", defaultPrice: 0, clinicId },
      { name: "Реставрация зуба", defaultPrice: 0, clinicId },
      { name: "Деветелизирующая паста", defaultPrice: 0, clinicId },
      { name: "Стекловолоконный штифт", defaultPrice: 0, clinicId },

      // Ортопедическая стоматология
      { name: "Металлокерамическая коронка", defaultPrice: 0, clinicId },
      { name: "Диоксид цирконий", defaultPrice: 0, clinicId },
      { name: "Открыто винтовая коронка на имплантах", defaultPrice: 0, clinicId },
      { name: "Культовая вкладка", defaultPrice: 0, clinicId },
      { name: "Напиленные коронки", defaultPrice: 0, clinicId },
      { name: "Бюгельный протез", defaultPrice: 0, clinicId },
      { name: "Простой съемный протез", defaultPrice: 0, clinicId },
      { name: "Баллочная фиксация на имплантах с диоксид цирконий", defaultPrice: 0, clinicId },
      { name: "Баллочная акриловая фиксация на имплантах", defaultPrice: 0, clinicId },
      { name: "Диоксид цирконий с абатменом", defaultPrice: 0, clinicId },

      // Хирургическая стоматология
      { name: "Удаление зуба", defaultPrice: 0, clinicId },
      { name: "Пластика уздечки", defaultPrice: 0, clinicId },
      { name: "Удаление ретентрованного зуба", defaultPrice: 0, clinicId },
      { name: "Удаление зуба мудрости", defaultPrice: 0, clinicId },
      { name: "Зашивание лунки", defaultPrice: 0, clinicId },

      // Имплантология
      { name: "Имплантация Dentium", defaultPrice: 0, clinicId },
      { name: "Имплантация Osstem", defaultPrice: 0, clinicId },
      { name: "Имплантация Impro", defaultPrice: 0, clinicId },
      { name: "Формирователь десны", defaultPrice: 0, clinicId },
      { name: "Мультиюниты", defaultPrice: 0, clinicId },
      { name: "Мембрана", defaultPrice: 0, clinicId },
      { name: "Костная пластика", defaultPrice: 0, clinicId },
      { name: "Синус лифтинг", defaultPrice: 0, clinicId },

      // Одноразовые наборы
      { name: "Одноразовый набор", defaultPrice: 0, clinicId },
      { name: "Тесты на гепатит В С и СПИД", defaultPrice: 0, clinicId },
      { name: "Анестезия", defaultPrice: 0, clinicId },
      { name: "Рентген", defaultPrice: 0, clinicId },
    ];

    // Save services sequentially
    for (const service of defaultServices) {
      await this.saveService(service as Service);
    }
  }

  // Helper methods for API fetching
  async fetchUserByEmail(email: string): Promise<User | null> {
    const user = await apiClient.getUserByEmail(email);
    if (user) {
      this.cache.users.set(user.id, user);
      this.notifyDataUpdate("users");
    }
    return user;
  }

  async fetchClinicById(id: string): Promise<Clinic | null> {
    const clinic = await apiClient.getClinicById(id);
    if (clinic) {
      this.cache.clinics.set(clinic.id, clinic);
      this.notifyDataUpdate("clinics");
    }
    return clinic;
  }

  // Get user by email (from cache only)
  getUserByEmail(email: string): User | undefined {
    return Array.from(this.cache.users.values()).find((u) => u.email === email);
  }

  getClinicById(clinicId: string): Clinic | undefined {
    return this.cache.clinics.get(clinicId);
  }

  // Super admin methods - get all cached data without clinic filtering
  getAllPatients(): Patient[] {
    return Array.from(this.cache.patients.values());
  }

  getAllDoctors(): Doctor[] {
    return Array.from(this.cache.doctors.values());
  }

  getAllVisits(): Visit[] {
    return Array.from(this.cache.visits.values());
  }

  getAllServices(): Service[] {
    return Array.from(this.cache.services.values());
  }

  getAllUsers(): User[] {
    return Array.from(this.cache.users.values());
  }

  // Migration helper - assign clinicId to existing cached data without it
  migrateDataToClinic(clinicId: string): void {
    // This is a no-op in API-only mode, data should already have clinicId
    // But keep for backwards compatibility
  }

  // Subscriptions (local only - no API endpoint yet)
  getSubscription(clinicId?: string): Subscription | null {
    // TODO: Implement subscription API endpoint
    return null;
  }

  getAllSubscriptions(clinicId?: string): Subscription[] {
    // TODO: Implement subscription API endpoint
    return [];
  }

  async saveSubscription(subscription: Subscription): Promise<void> {
    // TODO: Implement subscription API endpoint
    throw new Error("Subscription API endpoint not implemented");
  }
}

export const store = new Store();
