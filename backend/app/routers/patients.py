from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_db_session
from ..router_utils import get_clinic, get_patient

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("/", response_model=list[schemas.PatientResponse])
def list_patients(
    clinic_id: str | None = Query(default=None, alias="clinicId"),
    db: Session = Depends(get_db_session),
) -> list[models.Patient]:
    query = db.query(models.Patient)
    if clinic_id:
        get_clinic(db, clinic_id)
        query = query.filter(models.Patient.clinic_id == clinic_id)
    return query.order_by(models.Patient.created_at.desc()).all()


@router.post("/", response_model=schemas.PatientResponse, status_code=status.HTTP_201_CREATED)
def upsert_patient(payload: schemas.PatientPayload, db: Session = Depends(get_db_session)) -> models.Patient:
    clinic = get_clinic(db, payload.clinicId)
    teeth = [tooth.dict() for tooth in payload.teeth]
    services = list(payload.services)

    if payload.id:
        patient = db.query(models.Patient).filter_by(id=payload.id).first()
        if patient:
            patient.name = payload.name
            patient.phone = payload.phone
            patient.email = payload.email
            patient.date_of_birth = payload.dateOfBirth
            patient.is_child = payload.isChild
            patient.address = payload.address
            patient.notes = payload.notes
            patient.teeth = teeth
            patient.services = services
            patient.balance = payload.balance
            patient.clinic_id = clinic.id
            patient.updated_at = payload.updatedAt or datetime.utcnow()
            db.flush()
            return patient

    patient = models.Patient(
        id=payload.id or schemas.create_id("patient"),
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        date_of_birth=payload.dateOfBirth,
        is_child=payload.isChild,
        address=payload.address,
        notes=payload.notes,
        teeth=teeth,
        services=services,
        balance=payload.balance,
        clinic_id=clinic.id,
        created_at=payload.createdAt or datetime.utcnow(),
        updated_at=payload.updatedAt or datetime.utcnow(),
    )
    db.add(patient)
    db.flush()
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: str, db: Session = Depends(get_db_session)) -> None:
    patient = db.query(models.Patient).filter_by(id=patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    db.delete(patient)

