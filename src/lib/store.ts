// Data store with localStorage persistence
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
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error);
  }
};

// Store class
class Store {
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

  savePatient(patient: Patient): void {
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

  saveDoctor(doctor: Doctor): void {
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

  saveService(service: Service): void {
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

  saveVisit(visit: Visit): void {
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
  }

  deleteVisit(visitId: string): void {
    const clinicId = this.getCurrentClinicId();
    if (!clinicId) return;

    const allVisits = getFromStorage<Visit>(STORAGE_KEYS.VISITS, []);
    const visits = allVisits.filter((v) => !(v.id === visitId && v.clinicId === clinicId));
    saveToStorage(STORAGE_KEYS.VISITS, visits);
  }

  // Payments
  addPayment(visitId: string, amount: number): Payment {
    const clinicId = this.getCurrentClinicId();
    if (!clinicId) {
      throw new Error("No clinic ID available. Please log in.");
    }

    const allVisits = getFromStorage<Visit>(STORAGE_KEYS.VISITS, []);
    const visit = allVisits.find((v) => v.id === visitId && v.clinicId === clinicId);
    if (!visit) {
      throw new Error("Visit not found");
    }

    const payment: Payment = {
      id: `payment_${Date.now()}_${Math.random()}`,
      visitId,
      amount,
      date: new Date().toISOString(),
    };

    visit.payments = [...(visit.payments || []), payment];
    saveToStorage(STORAGE_KEYS.VISITS, allVisits);

    // Update patient balance
    const patient = this.getPatients().find((p) => p.id === visit.patientId);
    if (patient) {
      patient.balance = Math.max(0, patient.balance - amount);
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

  saveFile(file: PatientFile): void {
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
  updatePatientBalances(): void {
    const patients = this.getPatients();
    patients.forEach((patient) => {
      patient.balance = this.calculatePatientBalance(patient.id);
      this.savePatient(patient);
    });
  }

  // Initialize default services for current clinic
  initializeDefaultServices(): void {
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

    defaultServices.forEach((service) => {
      this.saveService({
        ...service,
        clinicId, // Add clinicId to each service
      });
    });
  }

  // Authentication
  getUsers(): User[] {
    return getFromStorage<User>(STORAGE_KEYS.USERS, []);
  }

  saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    saveToStorage(STORAGE_KEYS.USERS, users);
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

  saveClinic(clinic: Clinic): void {
    const clinics = this.getClinics();
    const index = clinics.findIndex((c) => c.id === clinic.id);
    if (index >= 0) {
      clinics[index] = clinic;
    } else {
      clinics.push(clinic);
    }
    saveToStorage(STORAGE_KEYS.CLINICS, clinics);
  }

  getClinicById(clinicId: string): Clinic | undefined {
    return this.getClinics().find((c) => c.id === clinicId);
  }

  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
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

