from __future__ import annotations

import os
from datetime import datetime
from typing import Any, Iterable, List, Optional, Union

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from database import Base, engine, get_db
import models
import schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Serkor Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _clinic_or_404(db: Session, clinic_id: str) -> models.Clinic:
    clinic = db.get(models.Clinic, clinic_id)
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    return clinic


def _ensure_unique_email(db: Session, email: str, user_id: Optional[str] = None) -> None:
    stmt = select(models.User).where(models.User.email == email)
    if user_id:
        stmt = stmt.where(models.User.id != user_id)
    if db.execute(stmt).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already exists")


def _visit_services_to_db(services: Iterable[Union[str, schemas.VisitServicePayload]]) -> List[dict]:
    converted: List[dict] = []
    for item in services:
        if isinstance(item, str):
            converted.append({"serviceId": item, "quantity": 1})
        else:
            converted.append(item.model_dump(by_alias=True))
    return converted


@app.exception_handler(Exception)
async def global_exception_handler(_request, exc):
    return JSONResponse(status_code=500, content={"error": str(exc)})


@app.get("/health")
def health_check():
    return {"ok": True, "timestamp": datetime.utcnow().isoformat()}


# Clinics ---------------------------------------------------------------------


@app.get("/api/clinics", response_model=Union[schemas.ClinicResponse, List[schemas.ClinicResponse]])
def list_clinics(id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    if id:
        clinic = db.get(models.Clinic, id)
        if not clinic:
            raise HTTPException(status_code=404, detail="Clinic not found")
        return schemas.ClinicResponse.model_validate(clinic)

    stmt = select(models.Clinic).order_by(models.Clinic.created_at.desc())
    clinics = db.execute(stmt).scalars().all()
    return [schemas.ClinicResponse.model_validate(clinic) for clinic in clinics]


@app.post("/api/clinics", response_model=schemas.ClinicResponse)
def upsert_clinic(payload: schemas.ClinicPayload, db: Session = Depends(get_db)):
    if payload.id:
        clinic = db.get(models.Clinic, payload.id)
        if not clinic:
            raise HTTPException(status_code=404, detail="Clinic not found")
        clinic.name = payload.name
    else:
        clinic = models.Clinic(
            id=payload.id or schemas.create_id("clinic"),
            name=payload.name,
            created_at=payload.createdAt or datetime.utcnow(),
        )
        db.add(clinic)

    db.commit()
    db.refresh(clinic)
    return schemas.ClinicResponse.model_validate(clinic)


# Users -----------------------------------------------------------------------


@app.get("/api/users", response_model=Union[schemas.UserResponse, List[schemas.UserResponse], None])
def list_users(
    email: Optional[str] = Query(None),
    clinicId: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    if email:
        user = db.execute(select(models.User).where(models.User.email == email)).scalar_one_or_none()
        if not user:
            return None
        return schemas.UserResponse.model_validate(user)

    stmt = select(models.User)
    if clinicId:
        stmt = stmt.where(models.User.clinic_id == clinicId)
    stmt = stmt.order_by(models.User.created_at.desc())
    users = db.execute(stmt).scalars().all()
    return [schemas.UserResponse.model_validate(user) for user in users]


@app.post("/api/users", response_model=schemas.UserResponse)
def upsert_user(payload: schemas.UserPayload, db: Session = Depends(get_db)):
    clinic = _clinic_or_404(db, payload.clinicId)
    _ensure_unique_email(db, payload.email, payload.id)

    if payload.id:
        user = db.get(models.User, payload.id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
    else:
        user = models.User(id=payload.id or schemas.create_id("user"), clinic=clinic)
        db.add(user)

    user.email = payload.email
    user.password = payload.password
    user.phone = payload.phone
    user.proficiency = payload.proficiency
    user.role = payload.role
    if payload.createdAt:
        user.created_at = payload.createdAt

    db.commit()
    db.refresh(user)
    return schemas.UserResponse.model_validate(user)


# Doctors ---------------------------------------------------------------------


@app.get("/api/doctors", response_model=List[schemas.DoctorResponse])
def list_doctors(clinicId: Optional[str] = Query(None), db: Session = Depends(get_db)):
    stmt = select(models.Doctor)
    if clinicId:
        stmt = stmt.where(models.Doctor.clinic_id == clinicId)
    stmt = stmt.order_by(models.Doctor.name.asc())
    doctors = db.execute(stmt).scalars().all()
    return [schemas.DoctorResponse.model_validate(doc) for doc in doctors]


@app.post("/api/doctors", response_model=schemas.DoctorResponse)
def upsert_doctor(payload: schemas.DoctorPayload, db: Session = Depends(get_db)):
    clinic = _clinic_or_404(db, payload.clinicId)

    # Upsert: update if exists, create if not
    doctor_id = payload.id or schemas.create_id("doctor")
    doctor = db.get(models.Doctor, doctor_id)
    
    if not doctor:
        doctor = models.Doctor(
            id=doctor_id,
            clinic=clinic,
        )
        db.add(doctor)

    doctor.name = payload.name
    doctor.specialization = payload.specialization
    doctor.email = payload.email
    doctor.phone = payload.phone
    doctor.color = payload.color
    doctor.user_id = payload.userId

    db.commit()
    db.refresh(doctor)
    return schemas.DoctorResponse.model_validate(doctor)


@app.delete("/api/doctors")
def delete_doctor(id: str = Query(...), clinicId: str = Query(...), db: Session = Depends(get_db)):
    doctor = db.get(models.Doctor, id)
    if not doctor or doctor.clinic_id != clinicId:
        raise HTTPException(status_code=404, detail="Doctor not found")
    db.delete(doctor)
    db.commit()
    return {"success": True}


# Services --------------------------------------------------------------------


@app.get("/api/services", response_model=List[schemas.ServiceResponse])
def list_services(clinicId: Optional[str] = Query(None), db: Session = Depends(get_db)):
    stmt = select(models.Service)
    if clinicId:
        stmt = stmt.where(models.Service.clinic_id == clinicId)
    stmt = stmt.order_by(models.Service.name.asc())
    services = db.execute(stmt).scalars().all()
    return [schemas.ServiceResponse.model_validate(service) for service in services]


@app.post("/api/services", response_model=schemas.ServiceResponse)
def upsert_service(payload: schemas.ServicePayload, db: Session = Depends(get_db)):
    clinic = _clinic_or_404(db, payload.clinicId)

    if payload.id:
        service = db.get(models.Service, payload.id)
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")
    else:
        service = models.Service(
            id=payload.id or schemas.create_id("service"),
            clinic=clinic,
        )
        db.add(service)

    service.name = payload.name
    service.default_price = payload.defaultPrice

    db.commit()
    db.refresh(service)
    return schemas.ServiceResponse.model_validate(service)


@app.delete("/api/services")
def delete_service(id: str = Query(...), clinicId: str = Query(...), db: Session = Depends(get_db)):
    service = db.get(models.Service, id)
    if not service or service.clinic_id != clinicId:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(service)
    db.commit()
    return {"success": True}


# Patients --------------------------------------------------------------------


@app.get("/api/patients", response_model=List[schemas.PatientResponse])
def list_patients(clinicId: Optional[str] = Query(None), db: Session = Depends(get_db)):
    stmt = select(models.Patient)
    if clinicId:
        stmt = stmt.where(models.Patient.clinic_id == clinicId)
    stmt = stmt.order_by(models.Patient.created_at.desc())
    patients = db.execute(stmt).scalars().all()
    return [schemas.PatientResponse.model_validate(patient) for patient in patients]


@app.post("/api/patients", response_model=schemas.PatientResponse)
def upsert_patient(payload: schemas.PatientPayload, db: Session = Depends(get_db)):
    clinic = _clinic_or_404(db, payload.clinicId)

    # Upsert: update if exists, create if not
    patient_id = payload.id or schemas.create_id("patient")
    patient = db.get(models.Patient, patient_id)
    
    if not patient:
        patient = models.Patient(
            id=patient_id,
            clinic=clinic,
            created_at=payload.createdAt or datetime.utcnow(),
        )
        db.add(patient)

    patient.name = payload.name
    patient.phone = payload.phone
    patient.email = (payload.email or "").strip() if payload.email else ""
    patient.date_of_birth = payload.dateOfBirth if payload.dateOfBirth else datetime.utcnow()
    patient.is_child = payload.isChild
    patient.address = payload.address
    patient.notes = payload.notes
    patient.teeth = [tooth.model_dump() for tooth in payload.teeth]
    patient.services = payload.services
    patient.balance = payload.balance
    patient.updated_at = payload.updatedAt or datetime.utcnow()

    db.commit()
    db.refresh(patient)
    return schemas.PatientResponse.model_validate(patient)


@app.delete("/api/patients")
def delete_patient(id: str = Query(...), clinicId: str = Query(...), db: Session = Depends(get_db)):
    patient = db.get(models.Patient, id)
    if not patient or patient.clinic_id != clinicId:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
    return {"success": True}


# Visits ----------------------------------------------------------------------


@app.get("/api/visits", response_model=List[schemas.VisitResponse])
def list_visits(clinicId: Optional[str] = Query(None), db: Session = Depends(get_db)):
    stmt = select(models.Visit)
    if clinicId:
        stmt = stmt.where(models.Visit.clinic_id == clinicId)
    stmt = stmt.order_by(models.Visit.start_time.desc())
    visits = db.execute(stmt).scalars().all()
    return [schemas.VisitResponse.model_validate(visit) for visit in visits]


@app.post("/api/visits", response_model=schemas.VisitResponse)
def upsert_visit(payload: schemas.VisitPayload, db: Session = Depends(get_db)):
    clinic = _clinic_or_404(db, payload.clinicId)
    patient = db.get(models.Patient, payload.patientId)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    if patient.clinic_id != clinic.id:
        raise HTTPException(status_code=400, detail="Patient belongs to another clinic")

    doctor: Optional[models.Doctor] = None
    if payload.doctorId:
        doctor = db.get(models.Doctor, payload.doctorId)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")

    services = _visit_services_to_db(payload.services)

    if payload.id:
        visit = db.get(models.Visit, payload.id)
        if not visit:
            raise HTTPException(status_code=404, detail="Visit not found")
    else:
        visit = models.Visit(
            id=payload.id or schemas.create_id("visit"),
            clinic=clinic,
            patient=patient,
            doctor=doctor,
            created_at=payload.createdAt or datetime.utcnow(),
        )
        db.add(visit)

    visit.patient = patient
    visit.doctor = doctor
    visit.start_time = payload.startTime
    visit.end_time = payload.endTime
    visit.services = services
    visit.cost = payload.cost
    visit.notes = payload.notes
    visit.status = payload.status
    visit.treated_teeth = payload.treatedTeeth
    visit.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(visit)
    return schemas.VisitResponse.model_validate(visit)


@app.delete("/api/visits")
def delete_visit(id: str = Query(...), clinicId: str = Query(...), db: Session = Depends(get_db)):
    visit = db.get(models.Visit, id)
    if not visit or visit.clinic_id != clinicId:
        raise HTTPException(status_code=404, detail="Visit not found")
    db.delete(visit)
    db.commit()
    return {"success": True}


# Payments --------------------------------------------------------------------


@app.post("/api/payments", response_model=schemas.PaymentResponse)
def add_payment(payload: schemas.PaymentPayload, db: Session = Depends(get_db)):
    visit = db.get(models.Visit, payload.visitId)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    payment = models.Payment(
        id=payload.id or schemas.create_id("payment"),
        visit=visit,
        amount=payload.amount,
        method=payload.method,
        date=payload.date or datetime.utcnow(),
    )
    db.add(payment)

    db.commit()
    db.refresh(payment)

    # Recalculate cash and ewallet totals
    cash_total = db.scalar(
        select(func.coalesce(func.sum(models.Payment.amount), 0)).where(
            models.Payment.visit_id == visit.id, models.Payment.method == "cash"
        )
    )
    wallet_total = db.scalar(
        select(func.coalesce(func.sum(models.Payment.amount), 0)).where(
            models.Payment.visit_id == visit.id, models.Payment.method == "ewallet"
        )
    )
    visit.cash_amount = float(cash_total or 0)
    visit.ewallet_amount = float(wallet_total or 0)
    db.commit()

    return schemas.PaymentResponse.model_validate(payment)


@app.delete("/api/payments/{payment_id}")
def delete_payment(payment_id: str, db: Session = Depends(get_db)):
    payment = db.get(models.Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    visit_id = payment.visit_id
    db.delete(payment)
    db.commit()

    visit = db.get(models.Visit, visit_id)
    if visit:
        cash_total = db.scalar(
            select(func.coalesce(func.sum(models.Payment.amount), 0)).where(
                models.Payment.visit_id == visit.id, models.Payment.method == "cash"
            )
        )
        wallet_total = db.scalar(
            select(func.coalesce(func.sum(models.Payment.amount), 0)).where(
                models.Payment.visit_id == visit.id, models.Payment.method == "ewallet"
            )
        )
        visit.cash_amount = float(cash_total or 0)
        visit.ewallet_amount = float(wallet_total or 0)
        db.commit()

    return {"success": True}


# Patient files ---------------------------------------------------------------


@app.get("/api/files", response_model=List[schemas.PatientFileResponse])
def list_files(
    patientId: Optional[str] = Query(None),
    clinicId: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    stmt = select(models.PatientFile)
    if patientId:
        stmt = stmt.where(models.PatientFile.patient_id == patientId)
    if clinicId:
        stmt = stmt.where(models.PatientFile.clinic_id == clinicId)
    stmt = stmt.order_by(models.PatientFile.uploaded_at.desc())
    files = db.execute(stmt).scalars().all()
    return [schemas.PatientFileResponse.model_validate(file) for file in files]


@app.post("/api/files", response_model=schemas.PatientFileResponse)
def upsert_file(payload: schemas.PatientFilePayload, db: Session = Depends(get_db)):
    clinic = _clinic_or_404(db, payload.clinicId)
    patient = db.get(models.Patient, payload.patientId)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if payload.id:
        file = db.get(models.PatientFile, payload.id)
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
    else:
        file = models.PatientFile(
            id=payload.id or schemas.create_id("file"),
            clinic=clinic,
            patient=patient,
            uploaded_at=payload.uploadedAt or datetime.utcnow(),
        )
        db.add(file)

    file.name = payload.name
    file.file_url = payload.file

    db.commit()
    db.refresh(file)
    return schemas.PatientFileResponse.model_validate(file)


@app.delete("/api/files")
def delete_file(id: str = Query(...), clinicId: str = Query(...), db: Session = Depends(get_db)):
    file = db.get(models.PatientFile, id)
    if not file or file.clinic_id != clinicId:
        raise HTTPException(status_code=404, detail="File not found")
    db.delete(file)
    db.commit()
    return {"success": True}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("BACKEND_PORT", "4000")), reload=True)
