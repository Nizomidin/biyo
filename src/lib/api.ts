// API client - all data operations go through the API

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
} from "./store";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const isJsonResponse = (response: Response) => {
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json");
};

const extractErrorMessage = (payload: unknown, fallback: string): string => {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }
  if (payload && typeof payload === "object") {
    const payloadObj = payload as {
      error?: unknown;
      message?: unknown;
      detail?: unknown;
    };
    const maybeError = payloadObj.detail ?? payloadObj.error ?? payloadObj.message;
    if (typeof maybeError === "string" && maybeError.trim().length > 0) {
      return maybeError;
    }
  }
  return fallback;
};

const buildQueryString = (
  params: Record<string, string | number | boolean | undefined | null> = {},
) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    searchParams.append(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
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
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...options.headers,
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      let payload: unknown = null;
      if (response.status !== 204) {
        if (isJsonResponse(response)) {
          payload = await response.json();
        } else {
          payload = await response.text();
        }
      }

      if (!response.ok) {
        const message = extractErrorMessage(
          payload,
          `API request failed with status ${response.status}`,
        );
        throw new ApiError(response.status, message, payload);
      }

      return payload as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Handle network errors gracefully
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(0, "Request timeout - сервер не отвечает", error);
      }
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new ApiError(0, "Не удалось подключиться к серверу. Проверьте подключение к интернету.", error);
      }
      const message =
        error instanceof Error ? error.message : "Unexpected error while calling API";
      throw new ApiError(0, message, error);
    }
  }

  // Patients
  async getPatients(clinicId?: string): Promise<Patient[]> {
    return await this.request<Patient[]>(`/patients${buildQueryString({ clinicId })}`);
  }

  async savePatient(patient: Patient): Promise<Patient> {
    return await this.request<Patient>("/patients", {
      method: "POST",
      body: JSON.stringify(patient),
    });
  }

  async deletePatient(patientId: string, clinicId: string): Promise<void> {
    await this.request<{ success: boolean }>(
      `/patients${buildQueryString({ id: patientId, clinicId })}`,
      { method: "DELETE" },
    );
  }

  // Doctors
  async getDoctors(clinicId?: string): Promise<Doctor[]> {
    return await this.request<Doctor[]>(`/doctors${buildQueryString({ clinicId })}`);
  }

  async saveDoctor(doctor: Doctor | Omit<Doctor, 'id'>): Promise<Doctor> {
    return await this.request<Doctor>("/doctors", {
      method: "POST",
      body: JSON.stringify(doctor),
    });
  }

  async deleteDoctor(doctorId: string, clinicId: string): Promise<void> {
    await this.request<{ success: boolean }>(
      `/doctors${buildQueryString({ id: doctorId, clinicId })}`,
      { method: "DELETE" },
    );
  }

  // Services
  async getServices(clinicId?: string): Promise<Service[]> {
    return await this.request<Service[]>(`/services${buildQueryString({ clinicId })}`);
  }

  async saveService(service: Service | Omit<Service, 'id'>): Promise<Service> {
    return await this.request<Service>("/services", {
      method: "POST",
      body: JSON.stringify(service),
    });
  }

  async deleteService(serviceId: string, clinicId: string): Promise<void> {
    await this.request<{ success: boolean }>(
      `/services${buildQueryString({ id: serviceId, clinicId })}`,
      { method: "DELETE" },
    );
  }

  // Visits
  async getVisits(clinicId?: string): Promise<Visit[]> {
    return await this.request<Visit[]>(`/visits${buildQueryString({ clinicId })}`);
  }

  async saveVisit(visit: Visit): Promise<Visit> {
    return await this.request<Visit>("/visits", {
      method: "POST",
      body: JSON.stringify(visit),
    });
  }

  async deleteVisit(visitId: string, clinicId: string): Promise<void> {
    await this.request<{ success: boolean }>(
      `/visits${buildQueryString({ id: visitId, clinicId })}`,
      { method: "DELETE" },
    );
  }

  // Files
  async getFiles(patientId?: string, clinicId?: string): Promise<PatientFile[]> {
    return await this.request<PatientFile[]>(
      `/files${buildQueryString({ patientId, clinicId })}`,
    );
  }

  async saveFile(file: PatientFile): Promise<PatientFile> {
    return await this.request<PatientFile>("/files", {
      method: "POST",
      body: JSON.stringify(file),
    });
  }

  async deleteFile(fileId: string, clinicId: string): Promise<void> {
    await this.request<{ success: boolean }>(
      `/files${buildQueryString({ id: fileId, clinicId })}`,
      { method: "DELETE" },
    );
  }

  // Users
  async getUsers(clinicId?: string): Promise<User[]> {
    return await this.request<User[]>(`/users${buildQueryString({ clinicId })}`);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.request<User | User[] | null>(
      `/users${buildQueryString({ email })}`,
    );
    if (!result) {
      return null;
    }
    if (Array.isArray(result)) {
      return result[0] ?? null;
    }
    return result;
  }

  async saveUser(user: User | Omit<User, 'id'>): Promise<User> {
    return await this.request<User>("/users", {
      method: "POST",
      body: JSON.stringify(user),
    });
  }

  // Clinics
  async getClinics(): Promise<Clinic[]> {
    return await this.request<Clinic[]>("/clinics");
  }

  async getClinicById(id: string): Promise<Clinic | null> {
    const result = await this.request<Clinic | Clinic[] | null>(
      `/clinics${buildQueryString({ id })}`,
    );
    if (!result) {
      return null;
    }
    if (Array.isArray(result)) {
      return result[0] ?? null;
    }
    return result;
  }

  async saveClinic(clinic: Clinic | Omit<Clinic, 'id'>): Promise<Clinic> {
    return await this.request<Clinic>("/clinics", {
      method: "POST",
      body: JSON.stringify(clinic),
    });
  }

  // Payments
  async addPayment(
    visitId: string,
    amount: number,
    method?: Payment["method"],
    date?: string,
  ): Promise<Payment> {
    return this.request<Payment>("/payments", {
      method: "POST",
      body: JSON.stringify({ visitId, amount, method, date }),
    });
  }

  async deletePayment(paymentId: string): Promise<void> {
    await this.request<{ success?: boolean }>(`/payments/${paymentId}`, { method: "DELETE" });
  }

  // OTP
  async sendOTP(phone: string): Promise<{ message: string; otp?: string }> {
    return this.request<{ message: string; otp?: string }>("/users/otp/send", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOTP(phone: string, otp: string): Promise<{ verified: boolean }> {
    return this.request<{ verified: boolean }>("/users/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    });
  }
}

export const apiClient = new ApiClient();

