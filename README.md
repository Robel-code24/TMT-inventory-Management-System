# Inventory Management System

Professional full-stack inventory management web application built by **Robel Hagos Mahray** — Computer Science Graduate, IUEA Uganda.

## Tech Stack

- **Frontend:** React, Tailwind CSS, Recharts, Vite
- **Backend:** Python, FastAPI, SQLAlchemy, JWT
- **Database:** SQLite (local dev) / PostgreSQL via Supabase (production)

## Quick Start (Local)

### 1. Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API runs at http://localhost:8000 — docs at http://localhost:8000/docs

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

App runs at http://localhost:5173

## Demo Accounts

| Role  | Email                 | Password  |
|-------|-----------------------|-----------|
| Admin | admin@inventory.com   | admin123  |
| Staff | staff@inventory.com   | staff123  |

## Features

- JWT authentication with Admin/Staff roles
- Dashboard with charts and real-time refresh
- Product, category, and supplier management
- Stock IN/OUT transactions with auto quantity updates
- Low stock alerts
- Reports with PDF/CSV export
- Activity log (admin only)
- Public developer profile at `/about`

## Environment Variables

**Backend** (`backend/.env`):

```
DATABASE_URL=sqlite:///./inventory.db
JWT_SECRET=your-secret-key
```

**Frontend** (`frontend/.env`):

```
VITE_API_URL=http://localhost:8000
```

## Deployment

- Frontend: Vercel (set root to `frontend/`)
- Backend: Hugging Face Spaces (Docker)
- Database: Supabase PostgreSQL (set `DATABASE_URL`)
