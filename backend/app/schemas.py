from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models import TransactionType, UserRole


# ── Auth ──────────────────────────────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[UserRole] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str = Field(min_length=6)
    role: UserRole = UserRole.staff


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[int] = None


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Category ──────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Supplier ──────────────────────────────────────────────────────────────────

class SupplierCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class SupplierResponse(BaseModel):
    id: int
    name: str
    contact_person: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Product ───────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    unit_price: float = Field(ge=0)
    quantity_in_stock: int = Field(ge=0, default=0)
    reorder_level: int = Field(ge=0, default=10)
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    unit_price: Optional[float] = Field(default=None, ge=0)
    reorder_level: Optional[int] = Field(default=None, ge=0)
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    sku: str
    description: Optional[str]
    unit_price: float
    quantity_in_stock: int
    reorder_level: int
    category_id: Optional[int]
    supplier_id: Optional[int]
    date_added: datetime
    is_low_stock: bool = False
    category_name: Optional[str] = None
    supplier_name: Optional[str] = None

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Stock ─────────────────────────────────────────────────────────────────────

class StockTransactionCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    transaction_type: TransactionType
    notes: Optional[str] = None


class StockTransactionResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    user_id: int
    user_name: str
    quantity: int
    transaction_type: TransactionType
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Activity ──────────────────────────────────────────────────────────────────

class ActivityLogResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    action: str
    entity_type: Optional[str]
    entity_id: Optional[int]
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_products: int
    low_stock_count: int
    total_inventory_value: float
    recent_activity: list[ActivityLogResponse]


class CategoryStockItem(BaseModel):
    category: str
    total_quantity: int


class TopProductItem(BaseModel):
    name: str
    quantity: int


class InventoryValuePoint(BaseModel):
    date: str
    value: float


class DashboardCharts(BaseModel):
    stock_by_category: list[CategoryStockItem]
    top_products: list[TopProductItem]
    inventory_value_over_time: list[InventoryValuePoint]
