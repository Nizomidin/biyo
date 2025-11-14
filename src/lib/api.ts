// API client for backend sync
// This will sync with a backend API while maintaining localStorage for immediate UI updates

// Import types from store FIRST to avoid circular dependency
import type {
  Patient,
  Doctor,
  Service,
  Visit,
  PatientFile,
  User,
  Clinic,
  Payment,
} from './store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

const isJsonResponse = (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json");
};

const extractErrorMessage = (payload: unknown, fallback: string): string => {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }
  if (payload && typeof payload === "object") {
    const payloadObj = payload as { error?: unknown; message?: unknown; detail?: unknown };
    const maybeError = payloadObj.detail ?? payloadObj.error ?? payloadObj.message;
    if (typeof maybeError === "string" && maybeError.trim().length > 0) {
      return maybeError;
    }
  }
  return fallback;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail?: unknown,
  ) {
    super(message);
    // Make detail accessible for error handling
    if (detail && typeof detail === 'object' && 'detail' in detail) {
      this.detail = (detail as { detail: unknown }).detail;
    } else {
      this.detail = detail;
    }
  }
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Patients
  async getPatients(clinicId?: string): Promise<Patient[]> {
    const params = clinicId ? `?clinicId=${clinicId}` : '';
    const result = await this.request<Patient[]>(`/patients${params}`);
    return result.data || [];
  }

  async savePatient(patient: Patient): Promise<Patient | null> {
    const result = await this.request<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(patient),
    });
    return result.data || null;
  }

  async deletePatient(patientId: string, clinicId: string): Promise<boolean> {
    const result = await this.request<{ success: boolean }>(
      `/patients?id=${patientId}&clinicId=${clinicId}`,
      { method: 'DELETE' }
    );
    return result.data?.success || false;
  }

  // Doctors
  async getDoctors(clinicId?: string): Promise<Doctor[]> {
    const params = clinicId ? `?clinicId=${clinicId}` : '';
    const result = await this.request<Doctor[]>(`/doctors${params}`);
    return result.data || [];
  }

  async saveDoctor(doctor: Doctor | Omit<Doctor, 'id'>): Promise<Doctor | null> {
    const result = await this.request<Doctor>('/doctors', {
      method: 'POST',
      body: JSON.stringify(doctor),
    });
    return result.data || null;
  }

  async deleteDoctor(doctorId: string, clinicId: string): Promise<boolean> {
    const result = await this.request<{ success: boolean }>(
      `/doctors?id=${doctorId}&clinicId=${clinicId}`,
      { method: 'DELETE' }
    );
    return result.data?.success || false;
  }

  // Services
  async getServices(clinicId?: string): Promise<Service[]> {
    const params = clinicId ? `?clinicId=${clinicId}` : '';
    const result = await this.request<Service[]>(`/services${params}`);
    return result.data || [];
  }

  async saveService(service: Service | Omit<Service, 'id'>): Promise<Service | null> {
    const result = await this.request<Service>('/services', {
      method: 'POST',
      body: JSON.stringify(service),
    });
    return result.data || null;
  }

  async deleteService(serviceId: string, clinicId: string): Promise<boolean> {
    const result = await this.request<{ success: boolean }>(
      `/services?id=${serviceId}&clinicId=${clinicId}`,
      { method: 'DELETE' }
    );
    return result.data?.success || false;
  }

  // Visits
  async getVisits(clinicId?: string): Promise<Visit[]> {
    const params = clinicId ? `?clinicId=${clinicId}` : '';
    const result = await this.request<Visit[]>(`/visits${params}`);
    return result.data || [];
  }

  async saveVisit(visit: Visit): Promise<Visit | null> {
    const result = await this.request<Visit>('/visits', {
      method: 'POST',
      body: JSON.stringify(visit),
    });
    return result.data || null;
  }

  async deleteVisit(visitId: string, clinicId: string): Promise<boolean> {
    const result = await this.request<{ success: boolean }>(
      `/visits?id=${visitId}&clinicId=${clinicId}`,
      { method: 'DELETE' }
    );
    return result.data?.success || false;
  }

  // Files
  async getFiles(patientId?: string, clinicId?: string): Promise<PatientFile[]> {
    const params = new URLSearchParams();
    if (patientId) params.append('patientId', patientId);
    if (clinicId) params.append('clinicId', clinicId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const result = await this.request<PatientFile[]>(`/files${query}`);
    return result.data || [];
  }

  async saveFile(file: PatientFile): Promise<PatientFile | null> {
    const result = await this.request<PatientFile>('/files', {
      method: 'POST',
      body: JSON.stringify(file),
    });
    return result.data || null;
  }

  async deleteFile(fileId: string, clinicId: string): Promise<boolean> {
    const result = await this.request<{ success: boolean }>(
      `/files?id=${fileId}&clinicId=${clinicId}`,
      { method: 'DELETE' }
    );
    return result.data?.success || false;
  }

  // Users
  async getUsers(clinicId?: string): Promise<User[]> {
    const params = clinicId ? `?clinicId=${clinicId}` : '';
    const result = await this.request<User[]>(`/users${params}`);
    return result.data || [];
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.request<User[]>(`/users?email=${email}`);
    // Backend returns an array, get first item
    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      return result.data[0];
    }
    return null;
  }

  async saveUser(user: User | Omit<User, 'id'>): Promise<User | null> {
    const result = await this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
    return result.data || null;
  }

  // Clinics
  async getClinics(): Promise<Clinic[]> {
    const result = await this.request<Clinic[]>('/clinics');
    return result.data || [];
  }

  async getClinicById(id: string): Promise<Clinic | null> {
    const result = await this.request<Clinic | Clinic[]>(`/clinics?id=${id}`);
    if (result.data) {
      // Backend may return single object or array
      if (Array.isArray(result.data)) {
        return result.data.length > 0 ? result.data[0] : null;
      }
      return result.data;
    }
    return null;
  }

  async saveClinic(clinic: Clinic | Omit<Clinic, 'id'>): Promise<Clinic | null> {
    const result = await this.request<Clinic>('/clinics', {
      method: 'POST',
      body: JSON.stringify(clinic),
    });
    return result.data || null;
  }

  // Payments
  async addPayment(
    visitId: string,
    amount: number,
    method?: Payment["method"],
    date?: string,
  ): Promise<Payment> {
    const result = await this.request<Payment>("/payments", {
      method: "POST",
      body: JSON.stringify({ visitId, amount, method, date }),
    });
    if (!result.data) {
      throw new Error(result.error || "Failed to add payment");
    }
    return result.data;
  }

  async deletePayment(paymentId: string): Promise<void> {
    await this.request<void>(`/payments/${paymentId}`, { method: "DELETE" });
  }

  // OTP
  async sendOTP(phone: string): Promise<{ message: string; otp?: string }> {
    const result = await this.request<{ message: string; otp?: string }>("/users/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
    if (!result.data) {
      throw new Error(result.error || "Failed to send OTP");
    }
    return result.data;
  }

  async verifyOTP(phone: string, otp: string): Promise<{ verified: boolean }> {
    const result = await this.request<{ verified: boolean }>("/users/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    });
    if (!result.data) {
      throw new Error(result.error || "Failed to verify OTP");
    }
    return result.data;
  }
}

export const apiClient = new ApiClient();

