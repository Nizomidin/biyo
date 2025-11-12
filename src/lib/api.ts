// API client for backend sync
// This will sync with a backend API while maintaining localStorage for immediate UI updates

// Import types from store FIRST to avoid circular dependency
import type {
  Clinic,
  Doctor,
  Patient,
  PatientFile,
  Payment,
  Service,
  User,
  Visit,
} from "./store";

const RAW_API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");
const DEFAULT_TIMEOUT_MS = 15000;

type HttpMethod = "GET" | "POST" | "DELETE";

interface RequestConfig {
  method?: HttpMethod;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
  timeoutMs?: number;
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
  private buildUrl(path: string, query?: RequestConfig["query"]): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${API_BASE_URL}${normalizedPath}`);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return;
        }
        url.searchParams.set(key, String(value));
      });
    }

    return url.toString();
  }

  private async request<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const {
      method = "GET",
      query,
      body,
      headers,
      signal,
      timeoutMs = DEFAULT_TIMEOUT_MS,
    } = config;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), timeoutMs);
    const externalAbortHandler = () => controller.abort(signal?.reason as DOMException | undefined);

    if (signal) {
      if (signal.aborted) {
        controller.abort(signal.reason as DOMException | undefined);
      } else {
        signal.addEventListener("abort", externalAbortHandler);
      }
    }

    try {
      const response = await fetch(this.buildUrl(path, query), {
        method,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        headers: {
          "Content-Type": body !== undefined ? "application/json" : undefined,
          ...headers,
        },
        signal: controller.signal,
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
        throw new ApiError(
          response.status,
          extractErrorMessage(payload, response.statusText || "Request failed"),
          payload,
        );
      }

      return payload as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiError(408, "Request timed out");
      }

      console.error("API request failed:", error);
      throw new ApiError(500, error instanceof Error ? error.message : "Unknown error");
    } finally {
      clearTimeout(timer);
      if (signal) {
        signal.removeEventListener("abort", externalAbortHandler);
      }
    }
  }

  // Patients
  async getPatients(clinicId?: string): Promise<Patient[]> {
    return this.request<Patient[]>("/patients", {
      query: clinicId ? { clinicId } : undefined,
    });
  }

  async savePatient(patient: Patient): Promise<Patient> {
    return this.request<Patient>("/patients", {
      method: "POST",
      body: patient,
    });
  }

  async deletePatient(patientId: string): Promise<void> {
    await this.request<void>(`/patients/${patientId}`, { method: "DELETE" });
  }

  // Doctors
  async getDoctors(clinicId?: string): Promise<Doctor[]> {
    return this.request<Doctor[]>("/doctors", {
      query: clinicId ? { clinicId } : undefined,
    });
  }

  async saveDoctor(doctor: Doctor): Promise<Doctor> {
    return this.request<Doctor>("/doctors", {
      method: "POST",
      body: doctor,
    });
  }

  async deleteDoctor(doctorId: string): Promise<void> {
    await this.request<void>(`/doctors/${doctorId}`, { method: "DELETE" });
  }

  // Services
  async getServices(clinicId?: string): Promise<Service[]> {
    return this.request<Service[]>("/services", {
      query: clinicId ? { clinicId } : undefined,
    });
  }

  async saveService(service: Service): Promise<Service> {
    return this.request<Service>("/services", {
      method: "POST",
      body: service,
    });
  }

  async deleteService(serviceId: string): Promise<void> {
    await this.request<void>(`/services/${serviceId}`, { method: "DELETE" });
  }

  // Visits
  async getVisits(clinicId?: string): Promise<Visit[]> {
    return this.request<Visit[]>("/visits", {
      query: clinicId ? { clinicId } : undefined,
    });
  }

  async saveVisit(visit: Visit): Promise<Visit> {
    return this.request<Visit>("/visits", {
      method: "POST",
      body: visit,
    });
  }

  async deleteVisit(visitId: string): Promise<void> {
    await this.request<void>(`/visits/${visitId}`, { method: "DELETE" });
  }

  // Files
  async getFiles(patientId?: string, clinicId?: string): Promise<PatientFile[]> {
    const files = await this.request<PatientFile[]>("/files", {
      query: {
        patientId,
        clinicId,
      },
    });
    return files.map((file) => ({
      ...file,
      file: (file as unknown as { file?: string; fileUrl?: string }).file ??
        (file as unknown as { fileUrl?: string }).fileUrl ?? file.file,
    })) as PatientFile[];
  }

  async saveFile(file: PatientFile): Promise<PatientFile> {
    if (typeof file.file !== "string") {
      throw new Error("Binary file uploads are not supported by the API");
    }

    return this.request<PatientFile>("/files", {
      method: "POST",
      body: {
        ...file,
        file: file.file,
      },
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.request<void>(`/files/${fileId}`, { method: "DELETE" });
  }

  // Users
  async getUsers(clinicId?: string): Promise<User[]> {
    return this.request<User[]>("/users", {
      query: clinicId ? { clinicId } : undefined,
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.request<User>(`/users/email/${encodeURIComponent(email)}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async saveUser(user: User): Promise<User> {
    return this.request<User>("/users", {
      method: "POST",
      body: user,
    });
  }

  // Clinics
  async getClinics(): Promise<Clinic[]> {
    return this.request<Clinic[]>("/clinics");
  }

  async getClinicById(id: string): Promise<Clinic | null> {
    try {
      return await this.request<Clinic>(`/clinics/${id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async saveClinic(clinic: Clinic): Promise<Clinic> {
    return this.request<Clinic>("/clinics", {
      method: "POST",
      body: clinic,
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
      body: { visitId, amount, method, date },
    });
  }

  async deletePayment(paymentId: string): Promise<void> {
    await this.request<void>(`/payments/${paymentId}`, { method: "DELETE" });
  }

  // OTP
  async sendOTP(phone: string): Promise<{ message: string; otp?: string }> {
    return this.request<{ message: string; otp?: string }>("/users/otp/send", {
      method: "POST",
      body: { phone },
    });
  }

  async verifyOTP(phone: string, otp: string): Promise<{ verified: boolean }> {
    return this.request<{ verified: boolean }>("/users/otp/verify", {
      method: "POST",
      body: { phone, otp },
    });
  }
}

export const apiClient = new ApiClient();

