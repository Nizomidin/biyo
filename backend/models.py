from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

try:
    from database import Base  # when executed as top-level module
except ImportError:  # pragma: no cover - package-relative fallback
    from .database import Base  # noqa: F401


class Clinic(Base):
    __tablename__ = "clinics"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    users: Mapped[List["User"]] = relationship("User", back_populates="clinic", cascade="all, delete-orphan")
    patients: Mapped[List["Patient"]] = relationship("Patient", back_populates="clinic", cascade="all, delete-orphan")
    doctors: Mapped[List["Doctor"]] = relationship("Doctor", back_populates="clinic", cascade="all, delete-orphan")
    services: Mapped[List["Service"]] = relationship("Service", back_populates="clinic", cascade="all, delete-orphan")
    visits: Mapped[List["Visit"]] = relationship("Visit", back_populates="clinic", cascade="all, delete-orphan")
    files: Mapped[List["PatientFile"]] = relationship("PatientFile", back_populates="clinic", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(64))
    clinic_id: Mapped[str] = mapped_column(ForeignKey("clinics.id", ondelete="CASCADE"))
    proficiency: Mapped[Optional[str]] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    clinic: Mapped[Clinic] = relationship("Clinic", back_populates="users")
    doctor_profile: Mapped[Optional["Doctor"]] = relationship("Doctor", back_populates="user", uselist=False)


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    specialization: Mapped[Optional[str]] = mapped_column(String(255))
    email: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(64))
    color: Mapped[str] = mapped_column(String(32), nullable=False)
    clinic_id: Mapped[str] = mapped_column(ForeignKey("clinics.id", ondelete="CASCADE"))
    user_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))

    clinic: Mapped[Clinic] = relationship("Clinic", back_populates="doctors")
    user: Mapped[Optional[User]] = relationship("User", back_populates="doctor_profile")
    visits: Mapped[List["Visit"]] = relationship("Visit", back_populates="doctor")


class Service(Base):
    __tablename__ = "services"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    default_price: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    clinic_id: Mapped[str] = mapped_column(ForeignKey("clinics.id", ondelete="CASCADE"))

    clinic: Mapped[Clinic] = relationship("Clinic", back_populates="services")


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(64), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    date_of_birth: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_child: Mapped[bool] = mapped_column(Boolean, default=False)
    address: Mapped[Optional[str]] = mapped_column(String(255))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    teeth: Mapped[list] = mapped_column(JSON, default=list)
    services: Mapped[list] = mapped_column(JSON, default=list)
    balance: Mapped[float] = mapped_column(Float, default=0)
    clinic_id: Mapped[str] = mapped_column(ForeignKey("clinics.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    clinic: Mapped[Clinic] = relationship("Clinic", back_populates="patients")
    visits: Mapped[List["Visit"]] = relationship("Visit", back_populates="patient", cascade="all, delete-orphan")
    files: Mapped[List["PatientFile"]] = relationship("PatientFile", back_populates="patient", cascade="all, delete-orphan")


class Visit(Base):
    __tablename__ = "visits"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"))
    doctor_id: Mapped[Optional[str]] = mapped_column(ForeignKey("doctors.id", ondelete="SET NULL"))
    clinic_id: Mapped[str] = mapped_column(ForeignKey("clinics.id", ondelete="CASCADE"))
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    services: Mapped[list] = mapped_column(JSON, default=list)
    cost: Mapped[float] = mapped_column(Float, default=0)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        Enum("scheduled", "completed", "cancelled", name="visit_status"),
        default="scheduled",
        nullable=False,
    )
    treated_teeth: Mapped[list] = mapped_column(JSON, default=list)
    cash_amount: Mapped[float] = mapped_column(Float, default=0)
    ewallet_amount: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient: Mapped[Patient] = relationship("Patient", back_populates="visits")
    doctor: Mapped[Optional[Doctor]] = relationship("Doctor", back_populates="visits")
    clinic: Mapped[Clinic] = relationship("Clinic", back_populates="visits")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="visit", cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    visit_id: Mapped[str] = mapped_column(ForeignKey("visits.id", ondelete="CASCADE"))
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    method: Mapped[Optional[str]] = mapped_column(String(32))

    visit: Mapped[Visit] = relationship("Visit", back_populates="payments")


class PatientFile(Base):
    __tablename__ = "patient_files"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"))
    clinic_id: Mapped[str] = mapped_column(ForeignKey("clinics.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_url: Mapped[str] = mapped_column(String(512), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    patient: Mapped[Patient] = relationship("Patient", back_populates="files")
    clinic: Mapped[Clinic] = relationship("Clinic", back_populates="files")
