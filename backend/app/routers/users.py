from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_db_session
from ..router_utils import get_clinic

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[schemas.UserResponse])
def list_users(
    clinic_id: str | None = Query(default=None, alias="clinicId"),
    db: Session = Depends(get_db_session),
) -> list[models.User]:
    query = db.query(models.User)
    if clinic_id:
        get_clinic(db, clinic_id)
        query = query.filter(models.User.clinic_id == clinic_id)
    return query.order_by(models.User.created_at.desc()).all()


@router.get("/email/{email}", response_model=schemas.UserResponse)
def get_user_by_email(email: str, db: Session = Depends(get_db_session)) -> models.User:
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.post("/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def upsert_user(payload: schemas.UserPayload, db: Session = Depends(get_db_session)) -> models.User:
    clinic = get_clinic(db, payload.clinicId)

    if payload.id:
        user = db.query(models.User).filter_by(id=payload.id).first()
        if user:
            if (
                payload.email != user.email
                and db.query(models.User)
                .filter(models.User.email == payload.email, models.User.id != payload.id)
                .first()
            ):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")
            user.email = payload.email
            user.password = payload.password
            user.proficiency = payload.proficiency
            user.role = payload.role
            user.clinic_id = clinic.id
            db.flush()
            return user

    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")

    user = models.User(
        id=payload.id or schemas.create_id("user"),
        email=payload.email,
        password=payload.password,
        clinic_id=clinic.id,
        proficiency=payload.proficiency,
        role=payload.role,
        created_at=payload.createdAt or datetime.utcnow(),
    )
    db.add(user)
    db.flush()
    return user

