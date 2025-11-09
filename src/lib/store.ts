// Data store with localStorage persistence and API sync
// Lazy import apiClient to avoid circular dependency
let apiClientPromise: Promise<any> | null = null;
const getApiClient = async () => {
  if (!apiClientPromise) {
    apiClientPromise = import('./api').then(module => module.apiClient);
  }
  return apiClientPromise;
};

// Enable API sync (set to true to enable backend sync)
// Default to true for full cross-device sync (works in both dev and prod)
// Set VITE_ENABLE_API_SYNC=false to disable
const ENABLE_API_SYNC = import.meta.env.VITE_ENABLE_API_SYNC === 'true';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
type ApiClientInstance = Awaited<ReturnType<typeof getApiClient>>;
const MAX_API_SYNC_FAILURES = 3;
let apiSyncEnabled = ENABLE_API_SYNC;
let apiSyncFailureCount = 0;
let apiSyncDisabledNotified = false;

const runApiSync = async (
  handler: (client: ApiClientInstance) => Promise<void>,
  context: string
) => {
  if (!apiSyncEnabled) return;

  try {
    const client = await getApiClient();
    await handler(client);
    apiSyncFailureCount = 0;
  } catch (error) {
    apiSyncFailureCount += 1;
    if (apiSyncFailureCount >= MAX_API_SYNC_FAILURES) {
      apiSyncEnabled = false;
      if (!apiSyncDisabledNotified && import.meta.env.DEV) {
        console.warn(
          `[API sync] Disabled after repeated failures. Latest error (${context}):`,
          error
        );
        apiSyncDisabledNotified = true;
      }
    } else if (import.meta.env.DEV && !apiSyncDisabledNotified) {
      console.warn(`[API sync] Failed (${context}). Retrying silently...`, error);
    }
  }
};

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
  clinicId: string; // Clinic this patient belongs to
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  defaultPrice: number;
  clinicId: string; // Clinic this service belongs to
}

export interface Doctor {
  id: string;
  name: string;
  specialization?: string;
  email?: string;
  phone?: string;
  color: string;
  clinicId: string; // Clinic this doctor belongs to
  userId?: string; // Optional: link to user account if doctor is also a user
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
  teeth?: number[]; // Teeth numbers this service was applied to
}

export interface Visit {
  id: string;
  patientId: string;
  doctorId: string;
  startTime: string; // ISO datetime string
  endTime: string; // ISO datetime string
  services: string[] | VisitService[]; // Service IDs (legacy) or VisitService[] (new)
  cost: number;
  notes?: string;
  status: "scheduled" | "completed" | "cancelled";
  payments: Payment[];
  treatedTeeth?: number[]; // Teeth numbers that were treated/cured during this visit
  clinicId: string; // Clinic this visit belongs to
  createdAt: string;
  cashAmount?: number;
  ewalletAmount?: number;
}

export interface PatientFile {
  id: string;
  patientId: string;
  name: string;
  file: File | string; // File object or URL
  clinicId: string; // Clinic this file belongs to
  uploadedAt: string;
}

export interface User {
  id: string;
  email: string;
  password?: string; // Optional password field
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

const STORAGE_KEYS = {
  PATIENTS: "biyo_patients",
  DOCTORS: "biyo_doctors",
  SERVICES: "biyo_services",
  VISITS: "biyo_visits",
  FILES: "biyo_files",
  USERS: "biyo_users",
  CLINICS: "biyo_clinics",
  CURRENT_USER: "biyo_current_user",
};

// Helper functions
const getFromStorage = <T>(key: string, defaultValue: T[]): T[] => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultValue;
    }
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, data: T[]): void => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error);
  }
};

// Store class
class Store {
  private upsertUsersLocally(usersToMerge: User | User[]): void {
    const incoming = Array.isArray(usersToMerge) ? usersToMerge : [usersToMerge];
    if (incoming.length === 0) {
      return;
    }

    const existing = getFromStorage<User>(STORAGE_KEYS.USERS, []);
    const byId = new Map(existing.map((user) => [user.id, user]));

    incoming.forEach((user) => {
      byId.set(user.id, user);
    });

    saveToStorage(STORAGE_KEYS.USERS, Array.from(byId.values()));
  }

  private upsertClinicsLocally(clinicsToMerge: Clinic | Clinic[]): void {
    const incoming = Array.isArray(clinicsToMerge) ? clinicsToMerge : [clinicsToMerge];
    if (incoming.length === 0) {
      return;
    }

    const existing = getFromStorage<Clinic>(STORAGE_KEYS.CLINICS, []);
    const byId = new Map(existing.map((clinic) => [clinic.id, clinic]));

    incoming.forEach((clinic) => {
      byId.set(clinic.id, clinic);
    });

    saveToStorage(STORAGE_KEYS.CLINICS, Array.from(byId.values()));
  }

  // Helper to get current user's clinic ID
  getCurrentClinicId(): string | null {
    const currentUser = this.getCurrentUser();
    return currentUser?.clinicId || null;
  }

  // Patients
  getPatients(clinicId?: string): Patient[] {
    const patients = getFromStorage<Patient>(STORAGE_KEYS.PATIENTS, []);
    const filterClinicId = clinicId || this.getCurrentClinicId();
    if (filterClinicId) {
      return patients.filter((p) => p.clinicId === filterClinicId);
    }
    return patients;
  }

  async savePatient(patient: Patient): Promise<void> {
    // Ensure clinicId is set from current user if not provided
    if (!patient.clinicId) {
      const clinicId = this.getCurrentClinicId();
      if (clinicId) {
        patient.clinicId = clinicId;
      } else {
        throw new Error("No clinic ID available. Please log in.");
      }
    }

    const patients = this.getPatients(); // Get all patients (will filter by clinic)
    const allPatients = getFromStorage<Patient>(STORAGE_KEYS.PATIENTS, []);
    const index = allPatients.findIndex((p) => p.id === patient.id);
    if (index >= 0) {
      allPatients[index] = { ...patient, updatedAt: new Date().toISOString() };
    } else {
      allPatients.push({
        ...patient,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    saveToStorage(STORAGE_KEYS.PATIENTS, allPatients);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('biyo-data-updated', { detail: { type: 'patients' } }));
    
    // Sync to API in background (don't wait for it)
    runApiSync((client) => client.savePatient(patient), 'savePatient');
  }

  deletePatient(patientId: string): void {
    const clinicId = this.getCurrentClinicId();
    if (!clinicId) return;

    const allPatients = getFromStorage<Patient>(STORAGE_KEYS.PATIENTS, []);
    const patients = allPatients.filter((p) => !(p.id === patientId && p.clinicId === clinicId));
    saveToStorage(STORAGE_KEYS.PATIENTS, patients);
    // Also delete associated visits and files
    const allVisits = getFromStorage<Visit>(STORAGE_KEYS.VISITS, []);
    const visits = allVisits.filter((v) => !(v.patientId === patientId && v.clinicId === clinicId));
    saveToStorage(STORAGE_KEYS.VISITS, visits);
    const allFiles = getFromStorage<PatientFile>(STORAGE_KEYS.FILES, []);
    const files = allFiles.filter((f) => !(f.patientId === patientId && f.clinicId === clinicId));
    saveToStorage(STORAGE_KEYS.FILES, files);
  }

  // Doctors
  getDoctors(clinicId?: string): Doctor[] {
    const doctors = getFromStorage<Doctor>(STORAGE_KEYS.DOCTORS, []);
    const filterClinicId = clinicId || this.getCurrentClinicId();
    if (filterClinicId) {
      return doctors.filter((d) => d.clinicId === filterClinicId);
    }
    return doctors;
  }

  async saveDoctor(doctor: Doctor): Promise<void> {
    // Ensure clinicId is set from current user if not provided
    if (!doctor.clinicId) {
      const clinicId = this.getCurrentClinicId();
      if (clinicId) {
        doctor.clinicId = clinicId;
      } else {
        throw new Error("No clinic ID available. Please log in.");
      }
    }

    const allDoctors = getFromStorage<Doctor>(STORAGE_KEYS.DOCTORS, []);
    const index = allDoctors.findIndex((d) => d.id === doctor.id);
    if (index >= 0) {
      allDoctors[index] = doctor;
    } else {
      allDoctors.push(doctor);
    }
    saveToStorage(STORAGE_KEYS.DOCTORS, allDoctors);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('biyo-data-updated', { detail: { type: 'doctors' } }));
    
    // Sync to API in background
    runApiSync((client) => client.saveDoctor(doctor), 'saveDoctor');
  }

  deleteDoctor(doctorId: string): void {
    const clinicId = this.getCurrentClinicId();
    if (!clinicId) return;

    const allDoctors = getFromStorage<Doctor>(STORAGE_KEYS.DOCTORS, []);
    const doctors = allDoctors.filter((d) => !(d.id === doctorId && d.clinicId === clinicId));
    saveToStorage(STORAGE_KEYS.DOCTORS, doctors);
  }

  // Services
  getServices(clinicId?: string): Service[] {
    const services = getFromStorage<Service>(STORAGE_KEYS.SERVICES, []);
    const filterClinicId = clinicId || this.getCurrentClinicId();
    if (filterClinicId) {
      return services.filter((s) => s.clinicId === filterClinicId);
    }
    return services;
  }

  async saveService(service: Service): Promise<void> {
    // Ensure clinicId is set from current user if not provided
    if (!service.clinicId) {
      const clinicId = this.getCurrentClinicId();
      if (clinicId) {
        service.clinicId = clinicId;
      } else {
        throw new Error("No clinic ID available. Please log in.");
      }
    }

    const allServices = getFromStorage<Service>(STORAGE_KEYS.SERVICES, []);
    const index = allServices.findIndex((s) => s.id === service.id);
    if (index >= 0) {
      allServices[index] = service;
    } else {
      allServices.push(service);
    }
    saveToStorage(STORAGE_KEYS.SERVICES, allServices);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('biyo-data-updated', { detail: { type: 'services' } }));
    
    // Sync to API in background
    runApiSync((client) => client.saveService(service), 'saveService');
  }

  deleteService(serviceId: string): void {
    const clinicId = this.getCurrentClinicId();
    if (!clinicId) return;

    const allServices = getFromStorage<Service>(STORAGE_KEYS.SERVICES, []);
    const services = allServices.filter((s) => !(s.id === serviceId && s.clinicId === clinicId));
    saveToStorage(STORAGE_KEYS.SERVICES, services);
  }

  // Visits
  getVisits(clinicId?: string): Visit[] {
    const visits = getFromStorage<Visit>(STORAGE_KEYS.VISITS, []);
    const filterClinicId = clinicId || this.getCurrentClinicId();
    if (filterClinicId) {
      return visits.filter((v) => v.clinicId === filterClinicId);
    }
    return visits;
  }

  async saveVisit(visit: Visit): Promise<void> {
    // Ensure clinicId is set from current user if not provided
    if (!visit.clinicId) {
      const clinicId = this.getCurrentClinicId();
      if (clinicId) {
        visit.clinicId = clinicId;
      } else {
        throw new Error("No clinic ID available. Please log in.");
      }
    }

    const allVisits = getFromStorage<Visit>(STORAGE_KEYS.VISITS, []);
    const index = allVisits.findIndex((v) => v.id === visit.id);
    if (index >= 0) {
      allVisits[index] = visit;
    } else {
      allVisits.push({
        ...visit,
        createdAt: new Date().toISOString(),
      });
    }
    saveToStorage(STORAGE_KEYS.VISITS, allVisits);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('biyo-data-updated', { detail: { type: 'visits' } }));
    
    // Sync to API in background
    runApiSync((client) => client.saveVisit(visit), 'saveVisit');
  }

  deleteVisit(visitId: string): void {
    const clinicId = this.getCurrentClinicId();
    if (!clinicId) return;

    const allVisits = getFromStorage<Visit>(STORAGE_KEYS.VISITS, []);
    const visits = allVisits.filter((v) => !(v.id === visitId && v.clinicId === clinicId));
    saveToStorage(STORAGE_KEYS.VISITS, visits);
  }

  // Payments
  async addPayment(visitId: string, amount: number, method: "cash" | "ewallet"): Promise<Payment> {
    const clinicId = this.getCurrentClinicId();
    if (!clinicId) {
      throw new Error("No clinic ID available. Please log in.");
    }

    const allVisits = getFromStorage<Visit>(STORAGE_KEYS.VISITS, []);
    const visit = allVisits.find((v) => v.id === visitId && v.clinicId === clinicId);
    if (!visit) {
      throw new Error("Visit not found");
    }

    if (amount <= 0 || !Number.isFinite(amount)) {
      throw new Error("Payment amount must be greater than zero");
    }

    const normalizedAmount = parseFloat(Number(amount).toFixed(2));

    const payment: Payment = {
      id: `payment_${Date.now()}_${Math.random()}`,
      visitId,
      amount: normalizedAmount,
      date: new Date().toISOString(),
      method,
    };

    visit.payments = [...(visit.payments || []), payment];
    const cashTotal = visit.payments
      .filter((p) => p.method === "cash")
      .reduce((sum, p) => sum + p.amount, 0);
    const walletTotal = visit.payments
      .filter((p) => p.method === "ewallet")
      .reduce((sum, p) => sum + p.amount, 0);
    visit.cashAmount = parseFloat(cashTotal.toFixed(2));
    visit.ewalletAmount = parseFloat(walletTotal.toFixed(2));
    saveToStorage(STORAGE_KEYS.VISITS, allVisits);
    
    // Sync to API in background
    runApiSync(
      (client) => client.addPayment(visitId, normalizedAmount, method, payment.date),
      'addPayment'
    );

    // Update patient balance
    const patient = this.getPatients().find((p) => p.id === visit.patientId);
    if (patient) {
      patient.balance = this.calculatePatientBalance(patient.id);
      this.savePatient(patient);
    }

    return payment;
  }

  // Files
  getFiles(clinicId?: string): PatientFile[] {
    const files = getFromStorage<PatientFile>(STORAGE_KEYS.FILES, []);
    const filterClinicId = clinicId || this.getCurrentClinicId();
    if (filterClinicId) {
      return files.filter((f) => f.clinicId === filterClinicId);
    }
    return files;
  }

  async saveFile(file: PatientFile): Promise<void> {
    // Ensure clinicId is set from current user if not provided
    if (!file.clinicId) {
      const clinicId = this.getCurrentClinicId();
      if (clinicId) {
        file.clinicId = clinicId;
      } else {
        throw new Error("No clinic ID available. Please log in.");
      }
    }

    const allFiles = getFromStorage<PatientFile>(STORAGE_KEYS.FILES, []);
    allFiles.push(file);
    saveToStorage(STORAGE_KEYS.FILES, allFiles);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('biyo-data-updated', { detail: { type: 'files' } }));
    
    // Sync to API in background
    runApiSync((client) => client.saveFile(file), 'saveFile');
  }

  deleteFile(fileId: string): void {
    const clinicId = this.getCurrentClinicId();
    if (!clinicId) return;

    const allFiles = getFromStorage<PatientFile>(STORAGE_KEYS.FILES, []);
    const files = allFiles.filter((f) => !(f.id === fileId && f.clinicId === clinicId));
    saveToStorage(STORAGE_KEYS.FILES, files);
  }

  // Calculate patient balance from visits
  calculatePatientBalance(patientId: string): number {
    const clinicId = this.getCurrentClinicId();
    if (!clinicId) return 0;

    const visits = this.getVisits().filter(
      (v) => v.patientId === patientId && v.status !== "cancelled" && v.clinicId === clinicId
    );
    const totalCost = visits.reduce((sum, v) => sum + v.cost, 0);
    const totalPaid = visits.reduce(
      (sum, v) => sum + (v.payments?.reduce((p, pay) => p + pay.amount, 0) || 0),
      0
    );
    return Math.max(0, totalCost - totalPaid);
  }

  // Update all patient balances
  async updatePatientBalances(): Promise<void> {
    const clinicId = this.getCurrentClinicId();
    if (!clinicId) {
      // No user logged in, skip balance update
      return;
    }
    const patients = this.getPatients();
    await Promise.all(patients.map(async (patient) => {
      patient.balance = this.calculatePatientBalance(patient.id);
      await this.savePatient(patient);
    }));
  }

  // Initialize default services for current clinic
  async initializeDefaultServices(): Promise<void> {
    const clinicId = this.getCurrentClinicId();
    if (!clinicId) {
      // No clinic ID yet, will initialize on first login
      return;
    }

    const existingServices = this.getServices();
    if (existingServices.length > 0) {
      return; // Services already initialized for this clinic
    }

    const defaultServices: Service[] = [
      // Лечебная стоматология
      { id: "therapeutic_1", name: "Пломбирование корневых каналов", defaultPrice: 0 },
      { id: "therapeutic_2", name: "Пломбирование передних зубов", defaultPrice: 0 },
      { id: "therapeutic_3", name: "Пломбирование боковых зубов", defaultPrice: 0 },
      { id: "therapeutic_4", name: "Реставрация зуба", defaultPrice: 0 },
      { id: "therapeutic_5", name: "Деветелизирующая паста", defaultPrice: 0 },
      { id: "therapeutic_6", name: "Стекловолоконный штифт", defaultPrice: 0 },
      
      // Ортопедическая стоматология
      { id: "prosthetic_1", name: "Металлокерамическая коронка", defaultPrice: 0 },
      { id: "prosthetic_2", name: "Диоксид цирконий", defaultPrice: 0 },
      { id: "prosthetic_3", name: "Открыто винтовая коронка на имплантах", defaultPrice: 0 },
      { id: "prosthetic_4", name: "Культовая вкладка", defaultPrice: 0 },
      { id: "prosthetic_5", name: "Напиленные коронки", defaultPrice: 0 },
      { id: "prosthetic_6", name: "Бюгельный протез", defaultPrice: 0 },
      { id: "prosthetic_7", name: "Простой съемный протез", defaultPrice: 0 },
      { id: "prosthetic_8", name: "Баллочная фиксация на имплантах с диоксид цирконий", defaultPrice: 0 },
      { id: "prosthetic_9", name: "Баллочная акриловая фиксация на имплантах", defaultPrice: 0 },
      { id: "prosthetic_10", name: "Диоксид цирконий с абатменом", defaultPrice: 0 },
      
      // Хирургическая стоматология
      { id: "surgical_1", name: "Удаление зуба", defaultPrice: 0 },
      { id: "surgical_2", name: "Пластика уздечки", defaultPrice: 0 },
      { id: "surgical_3", name: "Удаление ретентрованного зуба", defaultPrice: 0 },
      { id: "surgical_4", name: "Удаление зуба мудрости", defaultPrice: 0 },
      { id: "surgical_5", name: "Зашивание лунки", defaultPrice: 0 },
      
      // Имплантология
      { id: "implant_1", name: "Имплантация Dentium", defaultPrice: 0 },
      { id: "implant_2", name: "Имплантация Osstem", defaultPrice: 0 },
      { id: "implant_3", name: "Имплантация Impro", defaultPrice: 0 },
      { id: "implant_4", name: "Формирователь десны", defaultPrice: 0 },
      { id: "implant_5", name: "Мультиюниты", defaultPrice: 0 },
      { id: "implant_6", name: "Мембрана", defaultPrice: 0 },
      { id: "implant_7", name: "Костная пластика", defaultPrice: 0 },
      { id: "implant_8", name: "Синус лифтинг", defaultPrice: 0 },
      
      // Одноразовые наборы
      { id: "disposable_1", name: "Одноразовый набор", defaultPrice: 0 },
      { id: "disposable_2", name: "Тесты на гепатит В С и СПИД", defaultPrice: 0 },
      { id: "disposable_3", name: "Анестезия", defaultPrice: 0 },
      { id: "disposable_4", name: "Рентген", defaultPrice: 0 },
    ];

    // Save services sequentially to avoid race conditions
    for (const service of defaultServices) {
      await this.saveService({
        ...service,
        clinicId, // Add clinicId to each service
      });
    }
  }
  
  // Sync data from API (called periodically to get updates from other users)
  async syncFromAPI(): Promise<void> {
    if (!ENABLE_API_SYNC) return;
    
    const clinicId = this.getCurrentClinicId();
    if (!clinicId) return;

    try {
      // Fetch all data from API (with error handling for dynamic import)
      const client = await getApiClient().catch(err => {
        console.error('Failed to get API client:', err);
        return null;
      });
      
      if (!client) {
        console.warn('API client not available, skipping sync');
        return;
      }
      const [patients, doctors, services, visits, files, clinics, clinicUsers] = await Promise.all([
        client.getPatients(clinicId),
        client.getDoctors(clinicId),
        client.getServices(clinicId),
        client.getVisits(clinicId),
        client.getFiles(undefined, clinicId),
        client.getClinics(),
        client.getUsers(clinicId),
      ]);

      // Merge with localStorage (API data takes precedence)
      if (patients.length > 0) {
        const localPatients = getFromStorage<Patient>(STORAGE_KEYS.PATIENTS, []);
        const mergedPatients = [...localPatients];
        patients.forEach(apiPatient => {
          const index = mergedPatients.findIndex(p => p.id === apiPatient.id && p.clinicId === clinicId);
          if (index >= 0) {
            mergedPatients[index] = apiPatient;
          } else if (apiPatient.clinicId === clinicId) {
            mergedPatients.push(apiPatient);
          }
        });
        saveToStorage(STORAGE_KEYS.PATIENTS, mergedPatients);
      }

      if (doctors.length > 0) {
        const localDoctors = getFromStorage<Doctor>(STORAGE_KEYS.DOCTORS, []);
        const mergedDoctors = [...localDoctors];
        doctors.forEach(apiDoctor => {
          const index = mergedDoctors.findIndex(d => d.id === apiDoctor.id && d.clinicId === clinicId);
          if (index >= 0) {
            mergedDoctors[index] = apiDoctor;
          } else if (apiDoctor.clinicId === clinicId) {
            mergedDoctors.push(apiDoctor);
          }
        });
        saveToStorage(STORAGE_KEYS.DOCTORS, mergedDoctors);
      }

      if (services.length > 0) {
        const localServices = getFromStorage<Service>(STORAGE_KEYS.SERVICES, []);
        const mergedServices = [...localServices];
        services.forEach(apiService => {
          const index = mergedServices.findIndex(s => s.id === apiService.id && s.clinicId === clinicId);
          if (index >= 0) {
            mergedServices[index] = apiService;
          } else if (apiService.clinicId === clinicId) {
            mergedServices.push(apiService);
          }
        });
        saveToStorage(STORAGE_KEYS.SERVICES, mergedServices);
      }

      if (visits.length > 0) {
        const localVisits = getFromStorage<Visit>(STORAGE_KEYS.VISITS, []);
        const mergedVisits = [...localVisits];
        visits.forEach(apiVisit => {
          const index = mergedVisits.findIndex(v => v.id === apiVisit.id && v.clinicId === clinicId);
          if (index >= 0) {
            mergedVisits[index] = apiVisit;
          } else if (apiVisit.clinicId === clinicId) {
            mergedVisits.push(apiVisit);
          }
        });
        saveToStorage(STORAGE_KEYS.VISITS, mergedVisits);
      }

      if (files.length > 0) {
        const localFiles = getFromStorage<PatientFile>(STORAGE_KEYS.FILES, []);
        const mergedFiles = [...localFiles];
        files.forEach(apiFile => {
          const index = mergedFiles.findIndex(f => f.id === apiFile.id && f.clinicId === clinicId);
          if (index >= 0) {
            mergedFiles[index] = apiFile;
          } else if (apiFile.clinicId === clinicId) {
            mergedFiles.push(apiFile);
          }
        });
        saveToStorage(STORAGE_KEYS.FILES, mergedFiles);
      }

      if (clinics.length > 0) {
        this.upsertClinicsLocally(clinics);
      }

      if (clinicUsers.length > 0) {
        this.upsertUsersLocally(clinicUsers);
      }

      // Trigger refresh event
      window.dispatchEvent(new CustomEvent('biyo-data-updated', { detail: { type: 'sync' } }));
    } catch (error) {
      console.error('API sync failed:', error);
    }
  }

  async fetchUserByEmailFromAPI(email: string): Promise<User | null> {
    if (!ENABLE_API_SYNC) {
      return null;
    }

    try {
      const client = await getApiClient();
      const user = await client.getUserByEmail(email);
      if (user) {
        await this.saveUser(user, { skipApi: true });
        return user;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch user by email from API:', error);
      return null;
    }
  }

  async fetchAllUsersFromAPI(clinicId?: string): Promise<User[]> {
    if (!ENABLE_API_SYNC) {
      return this.getUsers();
    }

    try {
      const client = await getApiClient();
      const users = await client.getUsers(clinicId);
      if (users.length > 0) {
        this.upsertUsersLocally(users);
      }
      return users;
    } catch (error) {
      console.error('Failed to fetch users from API:', error);
      return this.getUsers();
    }
  }

  async fetchClinicsFromAPI(): Promise<Clinic[]> {
    if (!ENABLE_API_SYNC) {
      return this.getClinics();
    }

    try {
      const client = await getApiClient();
      const clinics = await client.getClinics();
      if (clinics.length > 0) {
        this.upsertClinicsLocally(clinics);
      }
      return clinics;
    } catch (error) {
      console.error('Failed to fetch clinics from API:', error);
      return this.getClinics();
    }
  }

  async fetchClinicByIdFromAPI(id: string): Promise<Clinic | null> {
    if (!ENABLE_API_SYNC) {
      return null;
    }

    try {
      const client = await getApiClient();
      const clinic = await client.getClinicById(id);
      if (clinic) {
        await this.saveClinic(clinic, { skipApi: true });
        return clinic;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch clinic by id from API:', error);
      return null;
    }
  }

  async migrateLocalDataToAPI(): Promise<{
    clinicsMigrated: number;
    usersMigrated: number;
    patientsMigrated: number;
    doctorsMigrated: number;
    servicesMigrated: number;
    visitsMigrated: number;
    filesMigrated: number;
    errors: string[];
  }> {
    if (!ENABLE_API_SYNC) {
      throw new Error('API sync is disabled. Enable VITE_ENABLE_API_SYNC to migrate data.');
    }

    const client = await getApiClient();
    const summary = {
      clinicsMigrated: 0,
      usersMigrated: 0,
      patientsMigrated: 0,
      doctorsMigrated: 0,
      servicesMigrated: 0,
      visitsMigrated: 0,
      filesMigrated: 0,
      errors: [] as string[],
    };

    const clinics = this.getClinics();
    for (const clinic of clinics) {
      try {
        await client.saveClinic(clinic);
        summary.clinicsMigrated++;
      } catch (error) {
        summary.errors.push(`Clinic ${clinic.id}: ${(error as Error).message}`);
      }
    }

    const users = this.getAllUsers();
    for (const user of users) {
      try {
        await client.saveUser(user);
        summary.usersMigrated++;
      } catch (error) {
        summary.errors.push(`User ${user.id}: ${(error as Error).message}`);
      }
    }

    const patients = this.getAllPatients();
    for (const patient of patients) {
      try {
        await client.savePatient(patient);
        summary.patientsMigrated++;
      } catch (error) {
        summary.errors.push(`Patient ${patient.id}: ${(error as Error).message}`);
      }
    }

    const doctors = this.getAllDoctors();
    for (const doctor of doctors) {
      try {
        await client.saveDoctor(doctor);
        summary.doctorsMigrated++;
      } catch (error) {
        summary.errors.push(`Doctor ${doctor.id}: ${(error as Error).message}`);
      }
    }

    const services = this.getAllServices();
    for (const service of services) {
      try {
        await client.saveService(service);
        summary.servicesMigrated++;
      } catch (error) {
        summary.errors.push(`Service ${service.id}: ${(error as Error).message}`);
      }
    }

    const visits = this.getAllVisits();
    for (const visit of visits) {
      try {
        await client.saveVisit(visit);
        summary.visitsMigrated++;
      } catch (error) {
        summary.errors.push(`Visit ${visit.id}: ${(error as Error).message}`);
      }
    }

    const files = getFromStorage<PatientFile>(STORAGE_KEYS.FILES, []);
    for (const file of files) {
      if (file && typeof file.file !== 'string') {
        summary.errors.push(`File ${file.id}: Skipped (binary file cannot be migrated automatically)`);
        continue;
      }
      try {
        await client.saveFile(file);
        summary.filesMigrated++;
      } catch (error) {
        summary.errors.push(`File ${file.id}: ${(error as Error).message}`);
      }
    }

    return summary;
  }

  // Authentication
  getUsers(): User[] {
    return getFromStorage<User>(STORAGE_KEYS.USERS, []);
  }

  async saveUser(user: User, options?: { skipApi?: boolean }): Promise<void> {
    this.upsertUsersLocally(user);

    if (!options?.skipApi) {
      await runApiSync((client) => client.saveUser(user), 'saveUser');
    }
  }

  getUserByEmail(email: string): User | undefined {
    return this.getUsers().find((u) => u.email === email);
  }

  getUsersByClinic(clinicId: string): User[] {
    return this.getUsers().filter((u) => u.clinicId === clinicId);
  }

  getClinics(): Clinic[] {
    return getFromStorage<Clinic>(STORAGE_KEYS.CLINICS, []);
  }

  async saveClinic(clinic: Clinic, options?: { skipApi?: boolean }): Promise<void> {
    this.upsertClinicsLocally(clinic);

    if (!options?.skipApi) {
      await runApiSync((client) => client.saveClinic(clinic), 'saveClinic');
    }
  }

  getClinicById(clinicId: string): Clinic | undefined {
    return this.getClinics().find((c) => c.id === clinicId);
  }

  getCurrentUser(): User | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }
      const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  logout(): void {
    this.setCurrentUser(null);
  }

  // Super admin methods - get all data without clinic filtering
  getAllPatients(): Patient[] {
    return getFromStorage<Patient>(STORAGE_KEYS.PATIENTS, []);
  }

  getAllDoctors(): Doctor[] {
    return getFromStorage<Doctor>(STORAGE_KEYS.DOCTORS, []);
  }

  getAllVisits(): Visit[] {
    return getFromStorage<Visit>(STORAGE_KEYS.VISITS, []);
  }

  getAllServices(): Service[] {
    return getFromStorage<Service>(STORAGE_KEYS.SERVICES, []);
  }

  getAllUsers(): User[] {
    return getFromStorage<User>(STORAGE_KEYS.USERS, []);
  }

  // Migration: Assign clinicId to existing data without it
  migrateDataToClinic(clinicId: string): void {
    // Migrate patients
    const allPatients = getFromStorage<Patient>(STORAGE_KEYS.PATIENTS, []);
    const patientsToMigrate = allPatients.filter((p) => !p.clinicId);
    patientsToMigrate.forEach((p) => {
      p.clinicId = clinicId;
    });
    if (patientsToMigrate.length > 0) {
      saveToStorage(STORAGE_KEYS.PATIENTS, allPatients);
    }

    // Migrate doctors
    const allDoctors = getFromStorage<Doctor>(STORAGE_KEYS.DOCTORS, []);
    const doctorsToMigrate = allDoctors.filter((d) => !d.clinicId);
    doctorsToMigrate.forEach((d) => {
      d.clinicId = clinicId;
    });
    if (doctorsToMigrate.length > 0) {
      saveToStorage(STORAGE_KEYS.DOCTORS, allDoctors);
    }

    // Migrate services
    const allServices = getFromStorage<Service>(STORAGE_KEYS.SERVICES, []);
    const servicesToMigrate = allServices.filter((s) => !s.clinicId);
    servicesToMigrate.forEach((s) => {
      s.clinicId = clinicId;
    });
    if (servicesToMigrate.length > 0) {
      saveToStorage(STORAGE_KEYS.SERVICES, allServices);
    }

    // Migrate visits
    const allVisits = getFromStorage<Visit>(STORAGE_KEYS.VISITS, []);
    const visitsToMigrate = allVisits.filter((v) => !v.clinicId);
    visitsToMigrate.forEach((v) => {
      v.clinicId = clinicId;
    });
    if (visitsToMigrate.length > 0) {
      saveToStorage(STORAGE_KEYS.VISITS, allVisits);
    }

    // Migrate files
    const allFiles = getFromStorage<PatientFile>(STORAGE_KEYS.FILES, []);
    const filesToMigrate = allFiles.filter((f) => !f.clinicId);
    filesToMigrate.forEach((f) => {
      f.clinicId = clinicId;
    });
    if (filesToMigrate.length > 0) {
      saveToStorage(STORAGE_KEYS.FILES, allFiles);
    }
  }
}

export const store = new Store();

// Note: initializeDefaultServices will be called after user login
// to ensure clinicId is available

