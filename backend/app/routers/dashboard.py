from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user, require_admin
from app.database import get_db
from app.models import ActivityLog, Category, Product, StockTransaction, User
from app.schemas import (
    ActivityLogResponse,
    CategoryStockItem,
    DashboardCharts,
    DashboardStats,
    InventoryValuePoint,
    ProductResponse,
    TopProductItem,
)
from app.routers.products import _to_response

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    products = db.query(Product).all()
    total_products = len(products)
    low_stock_count = sum(1 for p in products if p.quantity_in_stock <= p.reorder_level)
    total_value = sum(p.unit_price * p.quantity_in_stock for p in products)

    recent = (
        db.query(ActivityLog)
        .options(joinedload(ActivityLog.user))
        .order_by(ActivityLog.created_at.desc())
        .limit(8)
        .all()
    )

    return DashboardStats(
        total_products=total_products,
        low_stock_count=low_stock_count,
        total_inventory_value=round(total_value, 2),
        recent_activity=[
            ActivityLogResponse(
                id=a.id,
                user_id=a.user_id,
                user_name=a.user.full_name,
                action=a.action,
                entity_type=a.entity_type,
                entity_id=a.entity_id,
                details=a.details,
                created_at=a.created_at,
            )
            for a in recent
        ],
    )


@router.get("/charts", response_model=DashboardCharts)
def get_charts(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    # Stock by category
    rows = (
        db.query(Category.name, func.sum(Product.quantity_in_stock))
        .join(Product, Product.category_id == Category.id, isouter=False)
        .group_by(Category.name)
        .all()
    )
    stock_by_category = [CategoryStockItem(category=r[0], total_quantity=int(r[1])) for r in rows]

    uncategorized = db.query(func.sum(Product.quantity_in_stock)).filter(Product.category_id.is_(None)).scalar()
    if uncategorized:
        stock_by_category.append(CategoryStockItem(category="Uncategorized", total_quantity=int(uncategorized)))

    # Top 5 products
    top = db.query(Product).order_by(Product.quantity_in_stock.desc()).limit(5).all()
    top_products = [TopProductItem(name=p.name, quantity=p.quantity_in_stock) for p in top]

    # Inventory value over time (last 7 days based on transactions)
    value_over_time = []
    for i in range(6, -1, -1):
        day = datetime.utcnow().date() - timedelta(days=i)
        day_end = datetime.combine(day, datetime.max.time())
        products = db.query(Product).all()
        # Approximate: current value minus net changes after this day
        txs_after = (
            db.query(StockTransaction)
            .filter(StockTransaction.created_at > day_end)
            .all()
        )
        value = sum(p.unit_price * p.quantity_in_stock for p in products)
        for tx in txs_after:
            product = next((p for p in products if p.id == tx.product_id), None)
            if product:
                if tx.transaction_type.value == "in":
                    value -= tx.quantity * product.unit_price
                else:
                    value += tx.quantity * product.unit_price
        value_over_time.append(InventoryValuePoint(date=day.isoformat(), value=round(max(value, 0), 2)))

    return DashboardCharts(
        stock_by_category=stock_by_category,
        top_products=top_products,
        inventory_value_over_time=value_over_time,
    )
