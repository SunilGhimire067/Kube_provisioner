from app.core.security import verify_password

password = "AdminPassword123!"
full_hash = "$2b$12$ajhaFeWm5gkmc4Rc2u4dBu6LJWtG7XyaLjTvB8/O6PNlSD7bzwn7K"

result = verify_password(password, full_hash)
print(f"verify_password with full hash: {result}")
