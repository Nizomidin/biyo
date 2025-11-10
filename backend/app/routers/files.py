from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_db_session
from ..router_utils import get_clinic, get_patient

router = APIRouter(prefix="/files", tags=["files"])


@router.get("/", response_model=list[schemas.PatientFileResponse])
def list_files(
    patient_id: str | None = Query(default=None, alias="patientId"),
    clinic_id: str | None = Query(default=None, alias="clinicId"),
    db: Session = Depends(get_db_session),
) -> list[models.PatientFile]:
    query = db.query(models.PatientFile)
    if patient_id:
        get_patient(db, patient_id)
        query = query.filter(models.PatientFile.patient_id == patient_id)
    if clinic_id:
        get_clinic(db, clinic_id)
        query = query.filter(models.PatientFile.clinic_id == clinic_id)
    return query.order_by(models.PatientFile.uploaded_at.desc()).all()


@router.post("/", response_model=schemas.PatientFileResponse, status_code=status.HTTP_201_CREATED)
def upsert_file(payload: schemas.PatientFilePayload, db: Session = Depends(get_db_session)) -> models.PatientFile:
    patient = get_patient(db, payload.patientId)
    clinic = get_clinic(db, payload.clinicId)

    if payload.id:
        file_record = db.query(models.PatientFile).filter_by(id=payload.id).first()
        if file_record:
            file_record.patient_id = patient.id
            file_record.clinic_id = clinic.id
            file_record.name = payload.name
            file_record.file_url = payload.file
            db.flush()
            return file_record

    file_record = models.PatientFile(
        id=payload.id or schemas.create_id("file"),
        patient_id=patient.id,
        clinic_id=clinic.id,
        name=payload.name,
        file_url=payload.file,
    )
    db.add(file_record)
    db.flush()
    return file_record


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(file_id: str, db: Session = Depends(get_db_session)) -> None:
    file_record = db.query(models.PatientFile).filter_by(id=file_id).first()
    if not file_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    db.delete(file_record)

