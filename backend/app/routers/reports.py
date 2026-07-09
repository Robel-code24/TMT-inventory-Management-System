from datetime import datetime

from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models import Product, StockTransaction, User
from app.schemas import ProductResponse, StockTransactionResponse
from app.routers.products import _to_response
from app.routers.stock import _to_response as tx_to_response

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/stock-movement", response_model=list[StockTransactionResponse])
def stock_movement_report(
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = (
        db.query(StockTransaction)
        .options(joinedload(StockTransaction.product), joinedload(StockTransaction.user))
        .order_by(StockTransaction.created_at.desc())
    )
    if start_date:
        query = query.filter(StockTransaction.created_at >= start_date)
    if end_date:
        query = query.filter(StockTransaction.created_at <= end_date)
    return [tx_to_response(tx) for tx in query.all()]


@router.get("/low-stock", response_model=list[ProductResponse])
def low_stock_report(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    products = (
        db.query(Product)
        .options(joinedload(Product.category), joinedload(Product.supplier))
        .filter(Product.quantity_in_stock <= Product.reorder_level)
        .order_by(Product.quantity_in_stock)
        .all()
    )
    return [_to_response(p) for p in products]


@router.get("/valuation")
def valuation_report(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    products = db.query(Product).all()
    items = [
        {
            "name": p.name,
            "sku": p.sku,
            "quantity": p.quantity_in_stock,
            "unit_price": p.unit_price,
            "total_value": round(p.unit_price * p.quantity_in_stock, 2),
        }
        for p in products
    ]
    total = round(sum(i["total_value"] for i in items), 2)
    return {"items": items, "total_inventory_value": total}


@router.get("/export/stock-movement.csv", response_class=PlainTextResponse)
def export_stock_movement_csv(
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    txs = stock_movement_report(start_date, end_date, db, _)
    lines = ["Date,Product,Type,Quantity,User,Notes"]
    for tx in txs:
        lines.append(
            f"{tx.created_at.isoformat()},{tx.product_name},{tx.transaction_type.value},{tx.quantity},{tx.user_name},\"{tx.notes or ''}\""
        )
    return "\n".join(lines)


@router.get("/export/low-stock.csv", response_class=PlainTextResponse)
def export_low_stock_csv(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    products = low_stock_report(db, _)
    lines = ["Name,SKU,Quantity,Reorder Level,Unit Price"]
    for p in products:
        lines.append(f"{p.name},{p.sku},{p.quantity_in_stock},{p.reorder_level},{p.unit_price}")
    return "\n".join(lines)


@router.get("/export/valuation.csv", response_class=PlainTextResponse)
def export_valuation_csv(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    data = valuation_report(db, _)
    lines = ["Name,SKU,Quantity,Unit Price,Total Value"]
    for item in data["items"]:
        lines.append(f"{item['name']},{item['sku']},{item['quantity']},{item['unit_price']},{item['total_value']}")
    lines.append(f",,,Total,{data['total_inventory_value']}")
    return "\n".join(lines)
