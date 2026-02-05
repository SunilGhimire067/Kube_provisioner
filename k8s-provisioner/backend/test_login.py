"""
Test login flow
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from passlib.context import CryptContext

from app.core.config import settings
from app.models.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def test_login():
    """Test login flow"""
    # Create async engine
    engine = create_async_engine(str(settings.DATABASE_URL), echo=False)

    # Create session factory
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    email = "admin@k8s-provisioner.local"
    password = "AdminPassword123!"

    async with async_session() as session:
        # Find user by email
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        print(f"User found: {user is not None}")
        if user:
            print(f"User email: {user.email}")
            print(f"User is_active: {user.is_active}")
            print(f"User role: {user.role}")
            print(f"Hashed password (first 50 chars): {user.hashed_password[:50]}")

            # Test password verification
            verify_result = pwd_context.verify(password, user.hashed_password)
            print(f"Password verification: {verify_result}")

            if verify_result:
                print("✅ Login would succeed!")
            else:
                print("❌ Login would fail - password mismatch")
        else:
            print("❌ User not found")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(test_login())
