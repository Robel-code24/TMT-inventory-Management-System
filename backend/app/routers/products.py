import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user, require_admin
from app.database import get_db
from app.models import Product, User
from app.schemas import ProductCreate, ProductListResponse, ProductResponse, ProductUpdate
from app.utils import log_activity

router = APIRouter(prefix="/api/products", tags=["Products"])


def _to_response(product: Product) -> ProductResponse:
    return ProductResponse(
        id=product.id,
        name=product.name,
        sku=product.sku,
        description=product.description,
        unit_price=product.unit_price,
        quantity_in_stock=product.quantity_in_stock,
        reorder_level=product.reorder_level,
        category_id=product.category_id,
        supplier_id=product.supplier_id,
        date_added=product.date_added,
        is_low_stock=product.quantity_in_stock <= product.reorder_level,
        category_name=product.category.name if product.category else None,
        supplier_name=product.supplier.name if product.supplier else None,
    )


@router.get("/", response_model=ProductListResponse)
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = None,
    category_id: int | None = None,
    low_stock: bool | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Product).options(joinedload(Product.category), joinedload(Product.supplier))

    if search:
        query = query.filter(Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%"))
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if low_stock:
        query = query.filter(Product.quantity_in_stock <= Product.reorder_level)

    total = query.count()
    items = query.order_by(Product.name).offset((page - 1) * page_size).limit(page_size).all()

    return ProductListResponse(
        items=[_to_response(p) for p in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, math.ceil(total / page_size)),
    )


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    product = (
        db.query(Product)
        .options(joinedload(Product.category), joinedload(Product.supplier))
        .filter(Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return _to_response(product)


@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if db.query(Product).filter(Product.sku == payload.sku).first():
        raise HTTPException(status_code=400, detail="SKU already exists")

    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    log_activity(db, current_user, f"Added product '{product.name}'", "product", product.id)
    return _to_response(product)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    product = (
        db.query(Product)
        .options(joinedload(Product.category), joinedload(Product.supplier))
        .filter(Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if payload.sku and payload.sku != product.sku:
        if db.query(Product).filter(Product.sku == payload.sku).first():
            raise HTTPException(status_code=400, detail="SKU already exists")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    log_activity(db, current_user, f"Updated product '{product.name}'", "product", product.id)
    return _to_response(product)


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    log_activity(db, current_user, f"Deleted product '{product.name}'", "product", product.id)
    db.delete(product)
    db.commit()
