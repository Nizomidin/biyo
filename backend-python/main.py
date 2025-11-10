import os
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from models import (
    Patient,
    Doctor,
    Service,
    Visit,
    Clinic,
    User,
    PatientFile,
    Payment,
)
from sheets_client import SheetsClient
from repository import TableRepository

load_dotenv()

# Environment variables
SPREADSHEET_ID = os.getenv("GOOGLE_SHEETS_ID")
CLIENT_EMAIL = os.getenv("GOOGLE_CLIENT_EMAIL")
PRIVATE_KEY = os.getenv("GOOGLE_PRIVATE_KEY")
PORT = int(os.getenv("BACKEND_PORT", os.getenv("PORT", "4000")))

if not SPREADSHEET_ID or not CLIENT_EMAIL or not PRIVATE_KEY:
    raise ValueError(
        "Missing required environment variables: GOOGLE_SHEETS_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY"
    )

# Initialize Sheets client and repositories
sheets_client = SheetsClient(SPREADSHEET_ID, CLIENT_EMAIL, PRIVATE_KEY)

patients_repo = TableRepository[dict](sheets_client, "Patients")
doctors_repo = TableRepository[dict](sheets_client, "Doctors")
services_repo = TableRepository[dict](sheets_client, "Services")
visits_repo = TableRepository[dict](sheets_client, "Visits")
clinics_repo = TableRepository[dict](sheets_client, "Clinics")
users_repo = TableRepository[dict](sheets_client, "Users")
files_repo = TableRepository[dict](sheets_client, "Files")

# FastAPI app
app = FastAPI(title="Serkor Dental API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def create_id(prefix: str) -> str:
    """Generate unique ID"""
    import random
    import time
    return f"{prefix}_{int(time.time() * 1000)}_{random.randint(100000, 999999)}"


@app.get("/health")
def health():
    return {"ok": True, "timestamp": datetime.now().isoformat()}


# Patients routes
@app.get("/api/patients")
def get_patients(clinicId: Optional[str] = Query(None)):
    patients = patients_repo.list(
        lambda p: p.get("clinicId") == clinicId if clinicId else True
    )
    return patients


@app.post("/api/patients")
def create_patient(patient: Patient):
    now = datetime.now().isoformat()
    payload = patient.model_dump()
    if not payload.get("id"):
        payload["id"] = create_id("patient")
    if not payload.get("createdAt"):
        payload["createdAt"] = now
    payload["updatedAt"] = now
    patients_repo.upsert(payload)
    return payload


@app.delete("/api/patients")
def delete_patient(id: str = Query(...), clinicId: str = Query(...)):
    if not id or not clinicId:
        raise HTTPException(status_code=400, detail="Missing id or clinicId")
    patients_repo.delete_where(lambda p: p.get("id") == id and p.get("clinicId") == clinicId)
    return {"success": True}


# Doctors routes
@app.get("/api/doctors")
def get_doctors(clinicId: Optional[str] = Query(None)):
    doctors = doctors_repo.list(
        lambda d: d.get("clinicId") == clinicId if clinicId else True
    )
    return doctors


@app.post("/api/doctors")
def create_doctor(doctor: Doctor):
    payload = doctor.model_dump()
    if not payload.get("id"):
        payload["id"] = create_id("doctor")
    doctors_repo.upsert(payload)
    return payload


@app.delete("/api/doctors")
def delete_doctor(id: str = Query(...), clinicId: str = Query(...)):
    if not id or not clinicId:
        raise HTTPException(status_code=400, detail="Missing id or clinicId")
    doctors_repo.delete_where(lambda d: d.get("id") == id and d.get("clinicId") == clinicId)
    return {"success": True}


# Services routes
@app.get("/api/services")
def get_services(clinicId: Optional[str] = Query(None)):
    services = services_repo.list(
        lambda s: s.get("clinicId") == clinicId if clinicId else True
    )
    return services


@app.post("/api/services")
def create_service(service: Service):
    payload = service.model_dump()
    if not payload.get("id"):
        payload["id"] = create_id("service")
    services_repo.upsert(payload)
    return payload


@app.delete("/api/services")
def delete_service(id: str = Query(...), clinicId: str = Query(...)):
    if not id or not clinicId:
        raise HTTPException(status_code=400, detail="Missing id or clinicId")
    services_repo.delete_where(lambda s: s.get("id") == id and s.get("clinicId") == clinicId)
    return {"success": True}


# Visits routes
@app.get("/api/visits")
def get_visits(clinicId: Optional[str] = Query(None)):
    visits = visits_repo.list(
        lambda v: v.get("clinicId") == clinicId if clinicId else True
    )
    return visits


@app.post("/api/visits")
def create_visit(visit: Visit):
    payload = visit.model_dump()
    if not payload.get("id"):
        payload["id"] = create_id("visit")
    if not payload.get("createdAt"):
        payload["createdAt"] = datetime.now().isoformat()
    if "payments" not in payload:
        payload["payments"] = []
    visits_repo.upsert(payload)
    return payload


@app.delete("/api/visits")
def delete_visit(id: str = Query(...), clinicId: str = Query(...)):
    if not id or not clinicId:
        raise HTTPException(status_code=400, detail="Missing id or clinicId")
    visits_repo.delete_where(lambda v: v.get("id") == id and v.get("clinicId") == clinicId)
    return {"success": True}


# Payments routes
@app.post("/api/payments")
def create_payment(payment_data: dict):
    visit_id = payment_data.get("visitId")
    amount = payment_data.get("amount")
    method = payment_data.get("method")
    date = payment_data.get("date")

    if not visit_id or not isinstance(amount, (int, float)):
        raise HTTPException(status_code=400, detail="visitId and amount are required")

    visit = visits_repo.find(lambda v: v.get("id") == visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    payment = {
        "id": create_id("payment"),
        "visitId": visit_id,
        "amount": float(amount),
        "date": date or datetime.now().isoformat(),
        "method": method,
    }

    payments = visit.get("payments", []) + [payment]
    cash_amount = sum(
        p.get("amount", 0) for p in payments if p.get("method") == "cash"
    )
    ewallet_amount = sum(
        p.get("amount", 0) for p in payments if p.get("method") == "ewallet"
    )

    visit["payments"] = payments
    visit["cashAmount"] = round(cash_amount, 2)
    visit["ewalletAmount"] = round(ewallet_amount, 2)

    visits_repo.upsert(visit)
    return payment


# Clinics routes
@app.get("/api/clinics")
def get_clinics(id: Optional[str] = Query(None)):
    if id:
        clinic = clinics_repo.find(lambda c: c.get("id") == id)
        return clinic if clinic else None
    return clinics_repo.list()


@app.post("/api/clinics")
def create_clinic(clinic: Clinic):
    payload = clinic.model_dump()
    if not payload.get("id"):
        payload["id"] = create_id("clinic")
    if not payload.get("createdAt"):
        payload["createdAt"] = datetime.now().isoformat()
    clinics_repo.upsert(payload)
    return payload


# Users routes
@app.get("/api/users")
def get_users(email: Optional[str] = Query(None), clinicId: Optional[str] = Query(None)):
    if email:
        user = users_repo.find(lambda u: u.get("email") == email)
        return user if user else None
    
    users = users_repo.list(
        lambda u: u.get("clinicId") == clinicId if clinicId else True
    )
    return users


@app.post("/api/users")
def create_user(user: User):
    payload = user.model_dump()
    if not payload.get("id"):
        payload["id"] = create_id("user")
    if not payload.get("createdAt"):
        payload["createdAt"] = datetime.now().isoformat()
    users_repo.upsert(payload)
    return payload


# Files routes
@app.get("/api/files")
def get_files(patientId: Optional[str] = Query(None), clinicId: Optional[str] = Query(None)):
    files = files_repo.list(
        lambda f: (
            (not patientId or f.get("patientId") == patientId)
            and (not clinicId or f.get("clinicId") == clinicId)
        )
    )
    return files


@app.post("/api/files")
def create_file(file: PatientFile):
    payload = file.model_dump()
    if not payload.get("id"):
        payload["id"] = create_id("file")
    if not payload.get("uploadedAt"):
        payload["uploadedAt"] = datetime.now().isoformat()
    files_repo.upsert(payload)
    return payload


@app.delete("/api/files")
def delete_file(id: str = Query(...), clinicId: str = Query(...)):
    if not id or not clinicId:
        raise HTTPException(status_code=400, detail="Missing id or clinicId")
    files_repo.delete_where(lambda f: f.get("id") == id and f.get("clinicId") == clinicId)
    return {"success": True}


# Global exception handler for unhandled exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    print(f"Unhandled exception: {exc}")
    print(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"error": f"Internal server error: {str(exc)}"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)

