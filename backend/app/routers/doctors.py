from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_db_session
from ..router_utils import get_clinic, get_user

router = APIRouter(prefix="/doctors", tags=["doctors"])


@router.get("/", response_model=list[schemas.DoctorResponse])
def list_doctors(
    clinic_id: str | None = Query(default=None, alias="clinicId"),
    db: Session = Depends(get_db_session),
) -> list[models.Doctor]:
    query = db.query(models.Doctor)
    if clinic_id:
        get_clinic(db, clinic_id)
        query = query.filter(models.Doctor.clinic_id == clinic_id)
    return query.order_by(models.Doctor.name.asc()).all()


@router.post("/", response_model=schemas.DoctorResponse, status_code=status.HTTP_201_CREATED)
def upsert_doctor(payload: schemas.DoctorPayload, db: Session = Depends(get_db_session)) -> models.Doctor:
    clinic = get_clinic(db, payload.clinicId)
    user_id = None
    if payload.userId:
        user = get_user(db, payload.userId)
        user_id = user.id

    if payload.id:
        doctor = db.query(models.Doctor).filter_by(id=payload.id).first()
        if doctor:
            doctor.name = payload.name
            doctor.specialization = payload.specialization
            doctor.email = payload.email
            doctor.phone = payload.phone
            doctor.color = payload.color
            doctor.clinic_id = clinic.id
            doctor.user_id = user_id
            db.flush()
            return doctor

    doctor = models.Doctor(
        id=payload.id or schemas.create_id("doctor"),
        name=payload.name,
        specialization=payload.specialization,
        email=payload.email,
        phone=payload.phone,
        color=payload.color,
        clinic_id=clinic.id,
        user_id=user_id,
    )
    db.add(doctor)
    db.flush()
    return doctor


@router.delete("/{doctor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_doctor(doctor_id: str, db: Session = Depends(get_db_session)) -> None:
    doctor = db.query(models.Doctor).filter_by(id=doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    db.delete(doctor)

