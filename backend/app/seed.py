from sqlalchemy.orm import Session

from app.auth import hash_password
from app.database import SessionLocal
from app.models import Category, Product, Supplier, User, UserRole


def seed_database() -> None:
    db: Session = SessionLocal()
    try:
        if db.query(User).first():
            return

        admin = User(
            email="admin@inventory.com",
            full_name="Robel Hagos Mahray",
            hashed_password=hash_password("admin123"),
            role=UserRole.admin,
        )
        staff = User(
            email="staff@inventory.com",
            full_name="Staff User",
            hashed_password=hash_password("staff123"),
            role=UserRole.staff,
        )
        db.add_all([admin, staff])

        categories = [
            Category(name="Fresh Produce", description="Fresh fruits and vegetables"),
            Category(name="Dairy & Refrigerated", description="Dairy products and refrigerated items"),
            Category(name="Meat, Poultry & Seafood", description="Fresh and frozen meat, poultry, and seafood"),
            Category(name="Bakery Items", description="Bread, pastries, and baked goods"),
            Category(name="Dry Foods & Grains", description="Rice, pasta, cereals, and grains"),
            Category(name="Canned & Packaged Foods", description="Canned goods and packaged food items"),
            Category(name="Beverages", description="Soft drinks, juices, water, and other beverages"),
            Category(name="Snacks & Candy", description="Chips, cookies, candy, and confectionery"),
            Category(name="Cleaning Supplies", description="Cleaning products and household supplies"),
            Category(name="Personal Care & Toiletries", description="Personal hygiene and toiletry items"),
            Category(name="Baby & Pet Care", description="Baby products and pet supplies"),
            Category(name="Prepared Food Ingredients", description="Pre-cooked and ready-to-use ingredients"),
            Category(name="Packaging Materials", description="Packaging supplies and materials"),
        ]
        db.add_all(categories)
        db.flush()

        suppliers = [
            Supplier(name="FreshMart Ltd.", contact_person="John Doe", email="john@freshmart.com", phone="+256700000001"),
            Supplier(name="FoodSupply Co.", contact_person="Jane Smith", email="jane@foodsupply.com", phone="+256700000002"),
        ]
        db.add_all(suppliers)
        db.flush()

        products = [
            Product(name="Fresh Tomatoes", sku="FT-001", description="Fresh red tomatoes", unit_price=2.5, quantity_in_stock=100, reorder_level=20, category_id=categories[0].id, supplier_id=suppliers[0].id),
            Product(name="Whole Milk", sku="WM-002", description="Fresh whole milk 1L", unit_price=3.0, quantity_in_stock=50, reorder_level=15, category_id=categories[1].id, supplier_id=suppliers[0].id),
            Product(name="Chicken Breast", sku="CB-003", description="Fresh chicken breast 1kg", unit_price=8.5, quantity_in_stock=30, reorder_level=10, category_id=categories[2].id, supplier_id=suppliers[1].id),
            Product(name="White Bread", sku="WB-004", description="Fresh white bread loaf", unit_price=2.0, quantity_in_stock=40, reorder_level=15, category_id=categories[3].id, supplier_id=suppliers[0].id),
            Product(name="Rice 5kg", sku="R-005", description="Premium white rice 5kg", unit_price=15.0, quantity_in_stock=25, reorder_level=10, category_id=categories[4].id, supplier_id=suppliers[1].id),
        ]
        db.add_all(products)
        db.commit()
    finally:
        db.close()
