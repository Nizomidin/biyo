from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_db_session
from ..router_utils import get_clinic

router = APIRouter(prefix="/services", tags=["services"])


@router.get("/", response_model=list[schemas.ServiceResponse])
def list_services(
    clinic_id: str | None = Query(default=None, alias="clinicId"),
    db: Session = Depends(get_db_session),
) -> list[models.Service]:
    query = db.query(models.Service)
    if clinic_id:
        get_clinic(db, clinic_id)
        query = query.filter(models.Service.clinic_id == clinic_id)
    return query.order_by(models.Service.name.asc()).all()


@router.post("/", response_model=schemas.ServiceResponse, status_code=status.HTTP_201_CREATED)
def upsert_service(payload: schemas.ServicePayload, db: Session = Depends(get_db_session)) -> models.Service:
    clinic = get_clinic(db, payload.clinicId)

    if payload.id:
        service = db.query(models.Service).filter_by(id=payload.id).first()
        if service:
            service.name = payload.name
            service.default_price = payload.defaultPrice
            service.clinic_id = clinic.id
            db.flush()
            return service

    service = models.Service(
        id=payload.id or schemas.create_id("service"),
        name=payload.name,
        default_price=payload.defaultPrice,
        clinic_id=clinic.id,
    )
    db.add(service)
    db.flush()
    return service


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(service_id: str, db: Session = Depends(get_db_session)) -> None:
    service = db.query(models.Service).filter_by(id=service_id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    db.delete(service)

