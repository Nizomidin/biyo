from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_db_session

router = APIRouter(prefix="/clinics", tags=["clinics"])


@router.get("/", response_model=list[schemas.ClinicResponse])
def list_clinics(db: Session = Depends(get_db_session)) -> list[models.Clinic]:
    return db.query(models.Clinic).order_by(models.Clinic.created_at.desc()).all()


@router.get("/{external_id}", response_model=schemas.ClinicResponse)
def get_clinic(external_id: str, db: Session = Depends(get_db_session)) -> models.Clinic:
    clinic = db.query(models.Clinic).filter_by(id=external_id).first()
    if not clinic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic not found")
    return clinic


@router.post("/", response_model=schemas.ClinicResponse, status_code=status.HTTP_201_CREATED)
def upsert_clinic(payload: schemas.ClinicPayload, db: Session = Depends(get_db_session)) -> models.Clinic:
    clinic_id = payload.id or schemas.create_id("clinic")
    clinic = db.query(models.Clinic).filter_by(id=clinic_id).first()
    if clinic:
        clinic.name = payload.name
        db.flush()
        return clinic

    clinic = models.Clinic(
        id=clinic_id,
        name=payload.name,
        created_at=payload.createdAt or datetime.utcnow(),
    )
    db.add(clinic)
    db.flush()
    return clinic


@router.delete("/{external_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_clinic(external_id: str, db: Session = Depends(get_db_session)) -> None:
    clinic = db.query(models.Clinic).filter_by(id=external_id).first()
    if not clinic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic not found")
    db.delete(clinic)

