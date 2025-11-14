from __future__ import annotations

import json
import os
import sqlite3
import threading
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from models import Clinic, Doctor, Patient, PatientFile, Service, User, Visit
from models import Payment
from repository import TableRepository
from sheets_client import SheetsClient

load_dotenv()


class SQLiteSheetsClient:
    """Storage backend that mimics SheetsClient but persists data in a SQLite database."""

    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.db_path, check_same_thread=False)

    def _initialize(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS sheet_headers (
                    sheet TEXT PRIMARY KEY,
                    headers TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS sheet_rows (
                    sheet TEXT NOT NULL,
                    id TEXT NOT NULL,
                    clinic_id TEXT,
                    data TEXT NOT NULL,
                    position INTEGER NOT NULL,
                    PRIMARY KEY (sheet, id)
                )
                """
            )

    def _ensure_headers(self, conn: sqlite3.Connection, sheet: str, headers: list[str]) -> list[str]:
        cur = conn.execute("SELECT headers FROM sheet_headers WHERE sheet = ?", (sheet,))
        row = cur.fetchone()
        if row is None:
            stored = headers
            conn.execute(
                "INSERT OR REPLACE INTO sheet_headers(sheet, headers) VALUES(?, ?)",
                (sheet, json.dumps(headers)),
            )
        else:
            stored = json.loads(row[0])
            if stored != headers:
                stored = headers
                conn.execute(
                    "UPDATE sheet_headers SET headers = ? WHERE sheet = ?",
                    (json.dumps(headers), sheet),
                )
        return stored

    def get_rows(self, sheet_name: str, headers: list[str]) -> list[list[str]]:
        with self._lock, self._connect() as conn:
            stored_headers = self._ensure_headers(conn, sheet_name, headers)
            cur = conn.execute(
                "SELECT id, clinic_id, data FROM sheet_rows WHERE sheet = ? ORDER BY position ASC",
                (sheet_name,),
            )
            rows = cur.fetchall()

        result = [stored_headers]
        for row_id, clinic_id, data_json in rows:
            result.append([row_id, clinic_id or "", data_json])
        return result

    def append_row(self, sheet_name: str, headers: list[str], row: list[str]) -> None:
        if len(row) < 3:
            raise ValueError("Row data must contain id, clinicId and payload JSON")

        with self._lock, self._connect() as conn:
            self._ensure_headers(conn, sheet_name, headers)
            cur = conn.execute(
                "SELECT COALESCE(MAX(position), 0) FROM sheet_rows WHERE sheet = ?",
                (sheet_name,),
            )
            next_position = cur.fetchone()[0] + 1
            conn.execute(
                """
                INSERT OR REPLACE INTO sheet_rows(sheet, id, clinic_id, data, position)
                VALUES (?, ?, ?, ?, ?)
                """,
                (sheet_name, row[0], row[1] if len(row) > 1 else None, row[2], next_position),
            )

    def update_row(self, sheet_name: str, headers: list[str], row_index: int, row: list[str]) -> None:
        if len(row) < 3:
            raise ValueError("Row data must contain id, clinicId and payload JSON")

        with self._lock, self._connect() as conn:
            self._ensure_headers(conn, sheet_name, headers)
            conn.execute(
                """
                UPDATE sheet_rows
                SET clinic_id = ?, data = ?
                WHERE sheet = ? AND id = ?
                """,
                (row[1] if len(row) > 1 else None, row[2], sheet_name, row[0]),
            )

    def delete_rows(self, sheet_name: str, headers: list[str], row_indices: list[int]) -> None:
        if not row_indices:
            return

        with self._lock, self._connect() as conn:
            self._ensure_headers(conn, sheet_name, headers)
            cur = conn.execute(
                "SELECT id FROM sheet_rows WHERE sheet = ? ORDER BY position ASC",
                (sheet_name,),
            )
            ids_in_order = [row[0] for row in cur.fetchall()]

            ids_to_delete = []
            for row_index in row_indices:
                # TableRepository indexes start at 2 (header row is 1)
                list_index = row_index - 2
                if 0 <= list_index < len(ids_in_order):
                    ids_to_delete.append(ids_in_order[list_index])

            for row_id in ids_to_delete:
                conn.execute(
                    "DELETE FROM sheet_rows WHERE sheet = ? AND id = ?",
                    (sheet_name, row_id),
                )


def create_storage_client() -> Tuple[object, int]:
    spreadsheet_id = os.getenv("GOOGLE_SHEETS_ID")
    client_email = os.getenv("GOOGLE_CLIENT_EMAIL")
    private_key = os.getenv("GOOGLE_PRIVATE_KEY")
    port = int(os.getenv("BACKEND_PORT") or os.getenv("PORT") or "4000")

    if spreadsheet_id and client_email and private_key:
        print("✅ Using Google Sheets backend storage.")
        return (
            SheetsClient(
                spreadsheet_id=spreadsheet_id,
                client_email=client_email,
                private_key=private_key,
            ),
            port,
        )

    db_path = Path(os.getenv("SERKOR_DB_PATH", "backend/data.db"))
    print(f"💾 Using local SQLite database at {db_path.resolve()}.")
    return SQLiteSheetsClient(db_path), port


sheets_client, backend_port = create_storage_client()

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

    uvicorn.run("main:app", host="0.0.0.0", port=backend_port, reload=True)
