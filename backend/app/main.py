from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import init_db
from .routers import clinics, doctors, files, patients, payments, services, users, visits


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, debug=settings.debug)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(clinics.router, prefix="/api")
    app.include_router(users.router, prefix="/api")
    app.include_router(doctors.router, prefix="/api")
    app.include_router(services.router, prefix="/api")
    app.include_router(patients.router, prefix="/api")
    app.include_router(visits.router, prefix="/api")
    app.include_router(payments.router, prefix="/api")
    app.include_router(files.router, prefix="/api")

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"ok": "true"}

    return app


app = create_app()


@app.on_event("startup")
def startup() -> None:
    init_db()

