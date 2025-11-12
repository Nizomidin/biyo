from __future__ import annotations

import os
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

from models import Clinic, Doctor, Patient, PatientFile, Service, User, Visit
from models import Payment
from repository import TableRepository
from sheets_client import SheetsClient

load_dotenv()


class Settings(BaseSettings):
    spreadsheet_id: str
    client_email: str
    private_key: str
    port: int = 4000

    class Config:
        env_prefix = "GOOGLE_"
        env_file = ".env"
        env_file_encoding = "utf-8"


def create_settings() -> Settings:
    spreadsheet_id = os.getenv("GOOGLE_SHEETS_ID")
    client_email = os.getenv("GOOGLE_CLIENT_EMAIL")
    private_key = os.getenv("GOOGLE_PRIVATE_KEY")
    port = int(os.getenv("BACKEND_PORT") or os.getenv("PORT") or "4000")

    if not spreadsheet_id or not client_email or not private_key:
        raise RuntimeError("Missing Google Sheets environment variables")

    return Settings(
        spreadsheet_id=spreadsheet_id,
        client_email=client_email,
        private_key=private_key,
        port=port,
    )


settings = create_settings()

sheets_client = SheetsClient(
    spreadsheet_id=settings.spreadsheet_id,
    client_email=settings.client_email,
    private_key=settings.private_key,
)

patients_repo = TableRepository[dict](sheets_client, "Patients")
doctors_repo = TableRepository[dict](sheets_client, "Doctors")
services_repo = TableRepository[dict](sheets_client, "Services")
visits_repo = TableRepository[dict](sheets_client, "Visits")
clinics_repo = TableRepository[dict](sheets_client, "Clinics")
users_repo = TableRepository[dict](sheets_client, "Users")
files_repo = TableRepository[dict](sheets_client, "Files")

app = FastAPI(title="Serkor Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(_request, exc):
    return JSONResponse(status_code=500, content={"error": str(exc)})


def generate_id(prefix: str) -> str:
    timestamp = int(datetime.utcnow().timestamp() * 1000)
    return f"{prefix}_{timestamp}"


@app.get("/health")
def health_check():
    return {"ok": True, "timestamp": datetime.utcnow().isoformat()}


# Patients
@app.get("/api/patients")
def list_patients(clinicId: Optional[str] = Query(None)):
    return patients_repo.list(lambda p: p.get("clinicId") == clinicId if clinicId else True)


@app.post("/api/patients")
def save_patient(patient: Patient):
    payload = patient.model_dump()
    now = datetime.utcnow().isoformat()
    payload.setdefault("id", generate_id("patient"))
    payload.setdefault("createdAt", now)
    payload["updatedAt"] = now
    patients_repo.upsert(payload)
    return payload


@app.delete("/api/patients")
def remove_patient(id: str = Query(...), clinicId: str = Query(...)):
    patients_repo.delete_where(lambda p: p.get("id") == id and p.get("clinicId") == clinicId)
    return {"success": True}


# Doctors
@app.get("/api/doctors")
def list_doctors(clinicId: Optional[str] = Query(None)):
    return doctors_repo.list(lambda d: d.get("clinicId") == clinicId if clinicId else True)


@app.post("/api/doctors")
def save_doctor(doctor: Doctor):
    payload = doctor.model_dump()
    payload.setdefault("id", generate_id("doctor"))
    doctors_repo.upsert(payload)
    return payload


@app.delete("/api/doctors")
def remove_doctor(id: str = Query(...), clinicId: str = Query(...)):
    doctors_repo.delete_where(lambda d: d.get("id") == id and d.get("clinicId") == clinicId)
    return {"success": True}


# Services
@app.get("/api/services")
def list_services(clinicId: Optional[str] = Query(None)):
    return services_repo.list(lambda s: s.get("clinicId") == clinicId if clinicId else True)


@app.post("/api/services")
def save_service(service: Service):
    payload = service.model_dump()
    payload.setdefault("id", generate_id("service"))
    services_repo.upsert(payload)
    return payload


@app.delete("/api/services")
def remove_service(id: str = Query(...), clinicId: str = Query(...)):
    services_repo.delete_where(lambda s: s.get("id") == id and s.get("clinicId") == clinicId)
    return {"success": True}


# Visits
@app.get("/api/visits")
def list_visits(clinicId: Optional[str] = Query(None)):
    return visits_repo.list(lambda v: v.get("clinicId") == clinicId if clinicId else True)


@app.post("/api/visits")
def save_visit(visit: Visit):
    payload = visit.model_dump()
    payload.setdefault("id", generate_id("visit"))
    payload.setdefault("createdAt", datetime.utcnow().isoformat())
    payload.setdefault("payments", [])
    visits_repo.upsert(payload)
    return payload


@app.delete("/api/visits")
def remove_visit(id: str = Query(...), clinicId: str = Query(...)):
    visits_repo.delete_where(lambda v: v.get("id") == id and v.get("clinicId") == clinicId)
    return {"success": True}


# Payments
@app.post("/api/payments")
def add_payment(payment: Payment):
    visit = visits_repo.find(lambda v: v.get("id") == payment.visitId)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    payments = visit.get("payments", [])
    payload = payment.model_dump()
    payload.setdefault("id", generate_id("payment"))
    payload.setdefault("date", datetime.utcnow().isoformat())
    payments.append(payload)
    visit["payments"] = payments

    cash_total = sum(p.get("amount", 0) for p in payments if p.get("method") == "cash")
    wallet_total = sum(p.get("amount", 0) for p in payments if p.get("method") == "ewallet")
    visit["cashAmount"] = round(cash_total, 2)
    visit["ewalletAmount"] = round(wallet_total, 2)

    visits_repo.upsert(visit)
    return payload


# Clinics
@app.get("/api/clinics")
def list_clinics(id: Optional[str] = Query(None)):
    if id:
        return clinics_repo.find(lambda c: c.get("id") == id)
    return clinics_repo.list()


@app.post("/api/clinics")
def save_clinic(clinic: Clinic):
    payload = clinic.model_dump()
    payload.setdefault("id", generate_id("clinic"))
    payload.setdefault("createdAt", datetime.utcnow().isoformat())
    clinics_repo.upsert(payload)
    return payload


# Users
@app.get("/api/users")
def list_users(email: Optional[str] = Query(None), clinicId: Optional[str] = Query(None)):
    if email:
        return users_repo.find(lambda u: u.get("email") == email)
    return users_repo.list(lambda u: u.get("clinicId") == clinicId if clinicId else True)


@app.post("/api/users")
def save_user(user: User):
    payload = user.model_dump()
    payload.setdefault("id", generate_id("user"))
    payload.setdefault("createdAt", datetime.utcnow().isoformat())
    users_repo.upsert(payload)
    return payload


# Files
@app.get("/api/files")
def list_files(patientId: Optional[str] = Query(None), clinicId: Optional[str] = Query(None)):
    return files_repo.list(
        lambda f: (
            (not patientId or f.get("patientId") == patientId)
            and (not clinicId or f.get("clinicId") == clinicId)
        )
    )


@app.post("/api/files")
def save_file(file: PatientFile):
    payload = file.model_dump()
    payload.setdefault("id", generate_id("file"))
    payload.setdefault("uploadedAt", datetime.utcnow().isoformat())
    files_repo.upsert(payload)
    return payload


@app.delete("/api/files")
def remove_file(id: str = Query(...), clinicId: str = Query(...)):
    files_repo.delete_where(lambda f: f.get("id") == id and f.get("clinicId") == clinicId)
    return {"success": True}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=settings.port, reload=True)
