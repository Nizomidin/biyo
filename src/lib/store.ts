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
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  defaultPrice: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialization?: string;
  email?: string;
  phone?: string;
  color: string;
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
  createdAt: string;
}

export interface PatientFile {
  id: string;
  patientId: string;
  name: string;
  file: File | string; // File object or URL
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
  // Patients
  getPatients(clinicId?: string): Patient[] {
    const patients = getFromStorage<Patient>(STORAGE_KEYS.PATIENTS, []);
    if (clinicId) {
      // Filter patients by clinic if clinicId is provided
      // For now, all patients belong to the current clinic
      return patients;
    }
    return patients;
  }

  savePatient(patient: Patient): void {
    const patients = this.getPatients();
    const index = patients.findIndex((p) => p.id === patient.id);
    if (index >= 0) {
      patients[index] = { ...patient, updatedAt: new Date().toISOString() };
    } else {
      patients.push({
        ...patient,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    saveToStorage(STORAGE_KEYS.PATIENTS, patients);
  }

  deletePatient(patientId: string): void {
    const patients = this.getPatients().filter((p) => p.id !== patientId);
    saveToStorage(STORAGE_KEYS.PATIENTS, patients);
    // Also delete associated visits and files
    const visits = this.getVisits().filter((v) => v.patientId !== patientId);
    saveToStorage(STORAGE_KEYS.VISITS, visits);
    const files = this.getFiles().filter((f) => f.patientId !== patientId);
    saveToStorage(STORAGE_KEYS.FILES, files);
  }

  // Doctors
  getDoctors(): Doctor[] {
    return getFromStorage<Doctor>(STORAGE_KEYS.DOCTORS, []);
  }

  saveDoctor(doctor: Doctor): void {
    const doctors = this.getDoctors();
    const index = doctors.findIndex((d) => d.id === doctor.id);
    if (index >= 0) {
      doctors[index] = doctor;
    } else {
      doctors.push(doctor);
    }
    saveToStorage(STORAGE_KEYS.DOCTORS, doctors);
  }

  deleteDoctor(doctorId: string): void {
    const doctors = this.getDoctors().filter((d) => d.id !== doctorId);
    saveToStorage(STORAGE_KEYS.DOCTORS, doctors);
  }

  // Services
  getServices(): Service[] {
    return getFromStorage<Service>(STORAGE_KEYS.SERVICES, []);
  }

  saveService(service: Service): void {
    const services = this.getServices();
    const index = services.findIndex((s) => s.id === service.id);
    if (index >= 0) {
      services[index] = service;
    } else {
      services.push(service);
    }
    saveToStorage(STORAGE_KEYS.SERVICES, services);
  }

  deleteService(serviceId: string): void {
    const services = this.getServices().filter((s) => s.id !== serviceId);
    saveToStorage(STORAGE_KEYS.SERVICES, services);
  }

  // Visits
  getVisits(): Visit[] {
    return getFromStorage<Visit>(STORAGE_KEYS.VISITS, []);
  }

  saveVisit(visit: Visit): void {
    const visits = this.getVisits();
    const index = visits.findIndex((v) => v.id === visit.id);
    if (index >= 0) {
      visits[index] = visit;
    } else {
      visits.push({
        ...visit,
        createdAt: new Date().toISOString(),
      });
    }
    saveToStorage(STORAGE_KEYS.VISITS, visits);
  }

  deleteVisit(visitId: string): void {
    const visits = this.getVisits().filter((v) => v.id !== visitId);
    saveToStorage(STORAGE_KEYS.VISITS, visits);
  }

  // Payments
  addPayment(visitId: string, amount: number): Payment {
    const visits = this.getVisits();
    const visit = visits.find((v) => v.id === visitId);
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
    saveToStorage(STORAGE_KEYS.VISITS, visits);

    // Update patient balance
    const patient = this.getPatients().find((p) => p.id === visit.patientId);
    if (patient) {
      patient.balance = Math.max(0, patient.balance - amount);
      this.savePatient(patient);
    }

    return payment;
  }

  // Files
  getFiles(): PatientFile[] {
    return getFromStorage<PatientFile>(STORAGE_KEYS.FILES, []);
  }

  saveFile(file: PatientFile): void {
    const files = this.getFiles();
    files.push(file);
    saveToStorage(STORAGE_KEYS.FILES, files);
  }

  deleteFile(fileId: string): void {
    const files = this.getFiles().filter((f) => f.id !== fileId);
    saveToStorage(STORAGE_KEYS.FILES, files);
  }

  // Calculate patient balance from visits
  calculatePatientBalance(patientId: string): number {
    const visits = this.getVisits().filter(
      (v) => v.patientId === patientId && v.status !== "cancelled"
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

  // Initialize default services
  initializeDefaultServices(): void {
    const existingServices = this.getServices();
    if (existingServices.length > 0) {
      return; // Services already initialized
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
      this.saveService(service);
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
}

export const store = new Store();

// Initialize default services on first load
if (typeof window !== "undefined") {
  store.initializeDefaultServices();
}

