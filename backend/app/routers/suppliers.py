from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_admin
from app.database import get_db
from app.models import Product, Supplier, User
from app.schemas import SupplierCreate, SupplierResponse, SupplierUpdate
from app.utils import log_activity

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])


@router.get("/", response_model=list[SupplierResponse])
def list_suppliers(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Supplier).order_by(Supplier.name).all()


@router.post("/", response_model=SupplierResponse, status_code=201)
def create_supplier(
    payload: SupplierCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    supplier = Supplier(**payload.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    log_activity(db, admin, f"Created supplier '{supplier.name}'", "supplier", supplier.id)
    return supplier


@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    payload: SupplierUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)
    db.commit()
    db.refresh(supplier)
    log_activity(db, admin, f"Updated supplier '{supplier.name}'", "supplier", supplier.id)
    return supplier


@router.delete("/{supplier_id}", status_code=204)
def delete_supplier(supplier_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    if db.query(Product).filter(Product.supplier_id == supplier_id).count():
        raise HTTPException(status_code=400, detail="Supplier has linked products")

    log_activity(db, admin, f"Deleted supplier '{supplier.name}'", "supplier", supplier.id)
    db.delete(supplier)
    db.commit()
