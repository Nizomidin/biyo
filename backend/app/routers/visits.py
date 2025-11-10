from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_db_session
from ..router_utils import get_clinic, get_doctor, get_patient, get_visit

router = APIRouter(prefix="/visits", tags=["visits"])


def _normalize_services(raw_services: list[Any]) -> list[Any]:
    normalized: list[Any] = []
    for item in raw_services:
        if isinstance(item, schemas.VisitServicePayload):
            normalized.append(item.dict())
        elif isinstance(item, dict) and {"serviceId", "quantity"}.issubset(item.keys()):
            normalized.append(item)
        else:
            normalized.append(item)
    return normalized


@router.get("/", response_model=list[schemas.VisitResponse])
def list_visits(
    clinic_id: str | None = Query(default=None, alias="clinicId"),
    db: Session = Depends(get_db_session),
) -> list[models.Visit]:
    query = db.query(models.Visit)
    if clinic_id:
        get_clinic(db, clinic_id)
        query = query.filter(models.Visit.clinic_id == clinic_id)
    return query.order_by(models.Visit.start_time.desc()).all()


@router.post("/", response_model=schemas.VisitResponse, status_code=status.HTTP_201_CREATED)
def upsert_visit(payload: schemas.VisitPayload, db: Session = Depends(get_db_session)) -> models.Visit:
    clinic = get_clinic(db, payload.clinicId)
    patient = get_patient(db, payload.patientId)
    doctor_id = None
    if payload.doctorId:
        doctor = get_doctor(db, payload.doctorId)
        doctor_id = doctor.id

    services = _normalize_services(payload.services)

    if payload.id:
        visit = db.query(models.Visit).filter_by(id=payload.id).first()
        if visit:
            visit.patient_id = patient.id
            visit.doctor_id = doctor_id
            visit.clinic_id = clinic.id
            visit.start_time = payload.startTime
            visit.end_time = payload.endTime
            visit.services = services
            visit.cost = payload.cost
            visit.notes = payload.notes
            visit.status = payload.status
            visit.treated_teeth = payload.treatedTeeth
            visit.updated_at = datetime.utcnow()
            db.flush()
            return visit

    visit = models.Visit(
        id=payload.id or schemas.create_id("visit"),
        patient_id=patient.id,
        doctor_id=doctor_id,
        clinic_id=clinic.id,
        start_time=payload.startTime,
        end_time=payload.endTime,
        services=services,
        cost=payload.cost,
        notes=payload.notes,
        status=payload.status,
        treated_teeth=payload.treatedTeeth,
        created_at=payload.createdAt or datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(visit)
    db.flush()
    return visit


@router.delete("/{visit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_visit(visit_id: str, db: Session = Depends(get_db_session)) -> None:
    visit = db.query(models.Visit).filter_by(id=visit_id).first()
    if not visit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")
    db.delete(visit)


@router.post("/{visit_id}/status", response_model=schemas.VisitResponse)
def update_status(visit_id: str, status_value: str, db: Session = Depends(get_db_session)) -> models.Visit:
    visit = get_visit(db, visit_id)
    visit.status = status_value
    visit.updated_at = datetime.utcnow()
    db.flush()
    return visit

