from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..deps import get_db_session
from ..router_utils import get_visit

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/", response_model=schemas.PaymentResponse, status_code=status.HTTP_201_CREATED)
def upsert_payment(payload: schemas.PaymentPayload, db: Session = Depends(get_db_session)) -> models.Payment:
    visit = get_visit(db, payload.visitId)

    if payload.id:
        payment = db.query(models.Payment).filter_by(id=payload.id).first()
        if payment:
            payment.amount = payload.amount
            payment.method = payload.method
            payment.date = payload.date or payment.date
            payment.visit_id = visit.id
            db.flush()
            _recalculate_visit_totals(visit)
            return payment

    payment = models.Payment(
        id=payload.id or schemas.create_id("payment"),
        visit_id=visit.id,
        amount=payload.amount,
        method=payload.method,
        date=payload.date or datetime.utcnow(),
    )
    db.add(payment)
    db.flush()
    _recalculate_visit_totals(visit)
    return payment


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment(payment_id: str, db: Session = Depends(get_db_session)) -> None:
    payment = db.query(models.Payment).filter_by(id=payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    visit = payment.visit
    db.delete(payment)
    db.flush()
    _recalculate_visit_totals(visit)


def _recalculate_visit_totals(visit: models.Visit) -> None:
    payments = visit.payments
    visit.cash_amount = sum(p.amount for p in payments if p.method == "cash")
    visit.ewallet_amount = sum(p.amount for p in payments if p.method == "ewallet")

