from app.core.security import verify_password
from passlib.context import CryptContext

# Test the exact same password
password = "AdminPassword123!"

# Get hash from database
hash_from_db = "$2b$12$ajhaFeWm5gkmc4Rc2u4dBu6LJWtG7XyaLjTvB8/O6PN1lKxiEQsG."

# Test with app's verify_password
result = verify_password(password, hash_from_db)
print(f"verify_password result: {result}")

# Test with passlib directly
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
result2 = pwd_context.verify(password, hash_from_db)
print(f"pwd_context.verify result: {result2}")

# Test form data scenario
import urllib.parse
form_encoded = "username=admin@k8s-provisioner.local&password=AdminPassword123!"
parsed = urllib.parse.parse_qs(form_encoded)
print(f"Parsed password: {parsed.get('password')[0]}")
result3 = verify_password(parsed.get('password')[0], hash_from_db)
print(f"Form parsed password verification: {result3}")
