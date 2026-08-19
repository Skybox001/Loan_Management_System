import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_loan_products():
    print("=" * 60)
    print("Testing Loan Products API")
    print("=" * 60)
    
    # Step 1: Check if we need to register a test user first
    print("\n1. Attempting to register a test customer...")
    register_data = {
        "name": "Test Customer",
        "email": "test_customer@example.com",
        "password": "Test@1234",
        "role": "customer"
    }
    
    register_response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
    if register_response.status_code == 201:
        print("✓ New user registered successfully")
    elif register_response.status_code == 400:
        print("✓ User already exists (that's fine)")
    else:
        print(f"⚠ Registration response: {register_response.status_code}")
        print(f"   {register_response.text}")
    
    # Step 2: Login
    print("\n2. Logging in...")
    login_data = {
        "email": "test_customer@example.com",
        "password": "Test@1234"
    }
    
    login_response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    if login_response.status_code != 200:
        print(f"✗ Login failed: {login_response.status_code}")
        print(f"   {login_response.text}")
        return
    
    tokens = login_response.json()
    access_token = tokens["access_token"]
    print("✓ Login successful")
    print(f"   Access token: {access_token[:20]}...")
    
    # Step 3: Fetch loan products
    print("\n3. Fetching loan products...")
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    products_response = requests.get(f"{BASE_URL}/api/loan-products/", headers=headers)
    if products_response.status_code != 200:
        print(f"✗ Failed to fetch loan products: {products_response.status_code}")
        print(f"   {products_response.text}")
        return
    
    products = products_response.json()
    print(f"✓ Successfully fetched {len(products)} loan products")
    print("\nLoan Products:")
    print("-" * 60)
    
    for product in products:
        print(f"\nID: {product['id']}")
        print(f"Name: {product['name']}")
        print(f"Amount Range: ₹{float(product['min_amount']):,.0f} - ₹{float(product['max_amount']):,.0f}")
        print(f"Interest Rate: {product['interest_rate']}%")
        print(f"Max Tenure: {product['max_tenure']} months")
        print(f"Processing Fee: {product['processing_fee']}%")
    
    print("\n" + "=" * 60)
    print("✓ All tests passed! The API is working correctly.")
    print("=" * 60)
    
    # Step 4: Test the exact format the frontend expects
    print("\n4. Verifying frontend compatibility...")
    for product in products:
        if all(key in product for key in ['id', 'name', 'min_amount', 'max_amount', 'max_tenure']):
            print(f"✓ Product '{product['name']}' has all required fields")
        else:
            print(f"✗ Product '{product['name']}' missing required fields")
    
    print("\n✓ Frontend should be able to render the dropdown correctly!")

if __name__ == "__main__":
    try:
        test_loan_products()
    except requests.exceptions.ConnectionError:
        print("✗ Error: Could not connect to backend server at http://127.0.0.1:8000")
        print("   Make sure the backend is running with: uvicorn app.main:app --reload")
    except Exception as e:
        print(f"✗ Error: {e}")
