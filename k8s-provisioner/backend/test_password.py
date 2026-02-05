"""
Test password verification
"""
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Test password
password = "AdminPassword123!"

# Get the hash from database
db_hash = "$2b$12$y/l1UrJuLtNKfRHC/AHuBOpkE5i.vLjIJjlshB9XbR7rhxl1xoALK"

# Verify
result = pwd_context.verify(password, db_hash)
print(f"Password verification result: {result}")

# Also test creating a new hash and verifying
new_hash = pwd_context.hash(password)
print(f"\nNew hash: {new_hash}")
new_result = pwd_context.verify(password, new_hash)
print(f"New hash verification: {new_result}")
