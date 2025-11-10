from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from . import models


def get_clinic(db: Session, clinic_id: str) -> models.Clinic:
    clinic = db.query(models.Clinic).filter_by(id=clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinic not found")
    return clinic


def get_patient(db: Session, patient_id: str) -> models.Patient:
    patient = db.query(models.Patient).filter_by(id=patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


def get_doctor(db: Session, doctor_id: str) -> models.Doctor:
    doctor = db.query(models.Doctor).filter_by(id=doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return doctor


def get_visit(db: Session, visit_id: str) -> models.Visit:
    visit = db.query(models.Visit).filter_by(id=visit_id).first()
    if not visit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")
    return visit


def get_service(db: Session, service_id: str) -> models.Service:
    service = db.query(models.Service).filter_by(id=service_id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return service


def get_user(db: Session, user_id: str) -> models.User:
    user = db.query(models.User).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

