from typing import Literal, Optional
from pydantic import BaseModel


class ToothStatus(BaseModel):
    toothNumber: int
    status: Literal["healthy", "problem", "treating", "treated", "missing"]


class Patient(BaseModel):
    id: str
    name: str
    phone: str
    email: str
    dateOfBirth: str
    isChild: bool
    address: Optional[str] = None
    notes: Optional[str] = None
    teeth: list[ToothStatus]
    services: list[str]
    balance: float
    clinicId: str
    createdAt: str
    updatedAt: str


class Service(BaseModel):
    id: str
    name: str
    defaultPrice: float
    clinicId: str


class Doctor(BaseModel):
    id: str
    name: str
    specialization: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    color: str
    clinicId: str
    userId: Optional[str] = None


class Payment(BaseModel):
    id: str
    visitId: str
    amount: float
    date: str
    method: Optional[Literal["cash", "ewallet"]] = None


class VisitService(BaseModel):
    serviceId: str
    quantity: int
    teeth: Optional[list[int]] = None


class Visit(BaseModel):
    id: str
    patientId: str
    doctorId: str
    startTime: str
    endTime: str
    services: list[VisitService] | list[str]
    cost: float
    notes: Optional[str] = None
    status: Literal["scheduled", "completed", "cancelled"]
    payments: list[Payment]
    treatedTeeth: Optional[list[int]] = None
    clinicId: str
    createdAt: str
    cashAmount: Optional[float] = None
    ewalletAmount: Optional[float] = None


class PatientFile(BaseModel):
    id: str
    patientId: str
    name: str
    file: str
    clinicId: str
    uploadedAt: str


class User(BaseModel):
    id: str
    email: str
    password: Optional[str] = None
    clinicId: str
    proficiency: Optional[str] = None
    role: Literal["admin", "user"]
    createdAt: str


class Clinic(BaseModel):
    id: str
    name: str
    createdAt: str
