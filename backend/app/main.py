from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import activity, ai, auth, categories, dashboard, products, reports, stock, suppliers, users
from app.seed import seed_database

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TMT Inventory Management API",
    description="Built by Robel Hagos Mahray — IUEA Uganda",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type,Accept"
    return response

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(suppliers.router)
app.include_router(products.router)
app.include_router(stock.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(activity.router)
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])


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
