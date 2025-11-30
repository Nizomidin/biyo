from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Union
from uuid import uuid4

from pydantic import BaseModel, EmailStr, Field
from pydantic.config import ConfigDict


def to_camel(string: str) -> str:
    parts = string.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:])


def create_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:12]}"


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, alias_generator=to_camel)


class ClinicPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = None
    name: str
    createdAt: Optional[datetime] = None


class ClinicResponse(ORMModel):
    id: str
    name: str
    created_at: datetime


class UserPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = None
    email: EmailStr
    password: Optional[str] = None
    phone: Optional[str] = None
    clinicId: str
    proficiency: Optional[str] = None
    role: str = "user"
    createdAt: Optional[datetime] = None


class UserResponse(ORMModel):
    id: str
    email: EmailStr
    phone: Optional[str]
    clinic_id: str
    proficiency: Optional[str]
    role: str
    created_at: datetime


class DoctorPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = None
    name: str
    clinicId: str
    specialization: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    color: str = "blue"
    userId: Optional[str] = None


class DoctorResponse(ORMModel):
    id: str
    name: str
    specialization: Optional[str]
    email: Optional[EmailStr]
    phone: Optional[str]
    color: str
    clinic_id: str
    user_id: Optional[str]


class ServicePayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = None
    name: str
    defaultPrice: float = 0
    clinicId: str


class ServiceResponse(ORMModel):
    id: str
    name: str
    default_price: float
    clinic_id: str


class ToothStatus(BaseModel):
    toothNumber: int
    status: str


class PatientPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = None
    name: str
    phone: str
    email: Optional[EmailStr] = ""
    dateOfBirth: Optional[datetime] = None
    isChild: bool = False
    address: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = "active"
    teeth: List[ToothStatus] = Field(default_factory=list)
    services: List[str] = Field(default_factory=list)
    balance: float = 0
    clinicId: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


class PatientResponse(ORMModel):
    id: str
    name: str
    phone: str
    email: EmailStr
    date_of_birth: datetime
    is_child: bool
    address: Optional[str]
    notes: Optional[str]
    status: str
    teeth: List[dict]
    services: List[str]
    balance: float
    clinic_id: str
    created_at: datetime
    updated_at: datetime


class VisitServicePayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    serviceId: str
    quantity: int = 1
    teeth: Optional[List[int]] = None


class VisitPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = None
    patientId: str
    doctorId: Optional[str]
    clinicId: str
    startTime: datetime
    endTime: datetime
    services: List[Union[str, VisitServicePayload]] = Field(default_factory=list)
    cost: float = 0
    notes: Optional[str] = None
    status: str = "scheduled"
    treatedTeeth: List[int] = Field(default_factory=list)
    createdAt: Optional[datetime] = None


class VisitResponse(ORMModel):
    id: str
    patient_id: str
    doctor_id: Optional[str]
    clinic_id: str
    start_time: datetime
    end_time: datetime
    services: list
    cost: float
    notes: Optional[str]
    status: str
    treated_teeth: list
    cash_amount: float
    ewallet_amount: float
    created_at: datetime
    updated_at: datetime


class PaymentPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = None
    visitId: str
    amount: float
    method: Optional[str] = None
    date: Optional[datetime] = None


class PaymentResponse(ORMModel):
    id: str
    visit_id: str
    amount: float
    method: Optional[str]
    date: datetime


class PatientFilePayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = None
    patientId: str
    clinicId: str
    name: str
    file: str
    uploadedAt: Optional[datetime] = None


class PatientFileResponse(ORMModel):
    id: str
    patient_id: str
    clinic_id: str
    name: str
    file_url: str
    uploaded_at: datetime

