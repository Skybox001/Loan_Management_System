import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.loan_product import LoanProduct
from decimal import Decimal

def seed_loan_products():
    db: Session = SessionLocal()
    try:
        # Check if products already exist
        existing = db.query(LoanProduct).count()
        if existing > 0:
            print(f"Database already has {existing} loan products. Skipping seed.")
            return
        
        products = [
            LoanProduct(
                name="Personal Loan",
                min_amount=Decimal("50000"),
                max_amount=Decimal("500000"),
                interest_rate=Decimal("10.5"),
                max_tenure=60,
                processing_fee=Decimal("2.0")
            ),
            LoanProduct(
                name="Home Loan",
                min_amount=Decimal("500000"),
                max_amount=Decimal("10000000"),
                interest_rate=Decimal("8.5"),
                max_tenure=240,
                processing_fee=Decimal("1.0")
            ),
            LoanProduct(
                name="Car Loan",
                min_amount=Decimal("100000"),
                max_amount=Decimal("2000000"),
                interest_rate=Decimal("9.5"),
                max_tenure=84,
                processing_fee=Decimal("1.5")
            ),
            LoanProduct(
                name="Business Loan",
                min_amount=Decimal("200000"),
                max_amount=Decimal("5000000"),
                interest_rate=Decimal("12.0"),
                max_tenure=120,
                processing_fee=Decimal("2.5")
            ),
            LoanProduct(
                name="Education Loan",
                min_amount=Decimal("100000"),
                max_amount=Decimal("3000000"),
                interest_rate=Decimal("9.0"),
                max_tenure=180,
                processing_fee=Decimal("1.0")
            ),
        ]
        
        db.add_all(products)
        db.commit()
        print(f"Successfully seeded {len(products)} loan products!")
        
        for p in products:
            print(f"  - {p.name}: INR {p.min_amount:,.0f} to INR {p.max_amount:,.0f} @ {p.interest_rate}%")
    
    except Exception as e:
        print(f"Error seeding products: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_loan_products()
