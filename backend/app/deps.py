from collections.abc import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from .db import get_session


def get_db_session() -> Generator[Session, None, None]:
    yield from get_session()

# Alias for FastAPI dependency
DbSession = Depends(get_db_session)

