"""
Script to create admin user in the database
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

from app.core.config import settings
from app.models.models import User, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def create_admin_user():
    """Create admin user if it doesn't exist"""
    # Create async engine
    engine = create_async_engine(str(settings.DATABASE_URL), echo=False)

    # Create session factory
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        # Check if admin user exists
        from sqlalchemy import select
        result = await session.execute(
            select(User).where(User.email == settings.ADMIN_EMAIL)
        )
        existing_user = result.scalars().first()

        if existing_user:
            print(f"Admin user already exists: {settings.ADMIN_EMAIL}")
            return

        # Hash password
        hashed_password = pwd_context.hash(settings.ADMIN_PASSWORD)

        # Create admin user
        admin_user = User(
            email=settings.ADMIN_EMAIL,
            hashed_password=hashed_password,
            full_name=settings.ADMIN_FULL_NAME,
            role=UserRole.ADMIN,
            is_active=True
        )

        session.add(admin_user)
        await session.commit()

        print(f"Admin user created successfully!")
        print(f"Email: {settings.ADMIN_EMAIL}")
        print(f"Password: {settings.ADMIN_PASSWORD}")
        print(f"Role: {admin_user.role.value}")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_admin_user())
