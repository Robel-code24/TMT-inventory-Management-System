from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models import Product, StockTransaction, TransactionType, User
from app.schemas import StockTransactionCreate, StockTransactionResponse
from app.utils import log_activity

router = APIRouter(prefix="/api/stock", tags=["Stock"])


def _to_response(tx: StockTransaction) -> StockTransactionResponse:
    return StockTransactionResponse(
        id=tx.id,
        product_id=tx.product_id,
        product_name=tx.product.name,
        user_id=tx.user_id,
        user_name=tx.user.full_name,
        quantity=tx.quantity,
        transaction_type=tx.transaction_type,
        notes=tx.notes,
        created_at=tx.created_at,
    )


@router.get("/transactions", response_model=list[StockTransactionResponse])
def list_transactions(
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    product_id: int | None = None,
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
    if product_id:
        query = query.filter(StockTransaction.product_id == product_id)

    return [_to_response(tx) for tx in query.all()]


@router.post("/transactions", response_model=StockTransactionResponse, status_code=201)
def record_transaction(
    payload: StockTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if payload.transaction_type == TransactionType.out:
        if product.quantity_in_stock < payload.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")

    if payload.transaction_type == TransactionType.in_:
        product.quantity_in_stock += payload.quantity
    else:
        product.quantity_in_stock -= payload.quantity

    tx = StockTransaction(
        product_id=payload.product_id,
        user_id=current_user.id,
        quantity=payload.quantity,
        transaction_type=payload.transaction_type,
        notes=payload.notes,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    action = "Stock IN" if payload.transaction_type == TransactionType.in_ else "Stock OUT"
    log_activity(
        db,
        current_user,
        f"{action}: {payload.quantity} x {product.name}",
        "stock_transaction",
        tx.id,
    )

    tx = (
        db.query(StockTransaction)
        .options(joinedload(StockTransaction.product), joinedload(StockTransaction.user))
        .filter(StockTransaction.id == tx.id)
        .first()
    )
    return _to_response(tx)
