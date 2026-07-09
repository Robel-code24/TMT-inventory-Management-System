from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import activity, auth, categories, dashboard, products, reports, stock, suppliers, users
from app.seed import seed_database

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TMT Inventory Management API",
    description="Built by Robel Hagos Mahray — IUEA Uganda",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(suppliers.router)
app.include_router(products.router)
app.include_router(stock.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(activity.router)


@app.on_event("startup")
def on_startup():
    seed_database()


@app.get("/")
def root():
    return {
        "message": "Inventory Management API is running",
        "author": "Robel Hagos Mahray",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
