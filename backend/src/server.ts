import cors from "cors";
import express from "express";
import { env } from "./env";
import { createClinicsRouter } from "./routes/clinics";
import { createDoctorsRouter } from "./routes/doctors";
import { createFilesRouter } from "./routes/files";
import { createPatientsRouter } from "./routes/patients";
import { createPaymentsRouter } from "./routes/payments";
import { createServicesRouter } from "./routes/services";
import { createUsersRouter } from "./routes/users";
import { createVisitsRouter } from "./routes/visits";
import { SheetsClient } from "./sheetsClient";
import { TableRepository } from "./tableRepository";
import type {
  Clinic,
  Doctor,
  Patient,
  PatientFile,
  Service,
  User,
  Visit,
} from "./types";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "2mb" }));

const sheets = new SheetsClient(env.spreadsheetId, env.clientEmail, env.privateKey);

const patientsRepository = new TableRepository<Patient>(sheets, "Patients");
const doctorsRepository = new TableRepository<Doctor>(sheets, "Doctors");
const servicesRepository = new TableRepository<Service>(sheets, "Services");
const visitsRepository = new TableRepository<Visit>(sheets, "Visits");
const clinicsRepository = new TableRepository<Clinic>(sheets, "Clinics");
const usersRepository = new TableRepository<User>(sheets, "Users");
const filesRepository = new TableRepository<PatientFile>(sheets, "Files");

app.get(
  "/health",
  (req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  },
);

app.use("/api/patients", createPatientsRouter(patientsRepository));
app.use("/api/doctors", createDoctorsRouter(doctorsRepository));
app.use("/api/services", createServicesRouter(servicesRepository));
app.use("/api/visits", createVisitsRouter(visitsRepository));
app.use("/api/clinics", createClinicsRouter(clinicsRepository));
app.use("/api/users", createUsersRouter(usersRepository));
app.use("/api/files", createFilesRouter(filesRepository));
app.use("/api/payments", createPaymentsRouter(visitsRepository));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

app.listen(env.port, () => {
  console.log(`Backend server listening on port ${env.port}`);
});

