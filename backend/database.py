from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker


def _build_database_url() -> str:
    url = os.getenv("SERKOR_DB_URL")
    if url:
        return url
    path = os.getenv("SERKOR_DB_PATH")
    if not path:
        # Default: use data.db in the backend directory
        # This file is in backend/, so we use the same directory
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        path = os.path.join(backend_dir, "data.db")
    elif not os.path.isabs(path):
        # Convert relative path to absolute
        path = os.path.abspath(path)
    # Ensure parent directory exists
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return f"sqlite:///{path}"


DATABASE_URL = _build_database_url()
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def session_scope() -> Iterator[Session]:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

