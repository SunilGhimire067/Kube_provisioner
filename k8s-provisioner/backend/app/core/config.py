"""
Application configuration using Pydantic settings
"""
from typing import List
from pydantic_settings import BaseSettings
from pydantic import PostgresDsn, field_validator


class Settings(BaseSettings):
    """Application settings"""

    # Project info
    PROJECT_NAME: str = "Kubernetes Provisioner Platform"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: PostgresDsn
    DATABASE_ECHO: bool = False

    @property
    def SYNC_DATABASE_URL(self) -> str:
        """Convert async DATABASE_URL to sync URL for Alembic"""
        url = str(self.DATABASE_URL)
        # Replace asyncpg with psycopg2
        return url.replace("postgresql+asyncpg://", "postgresql+psycopg2://").replace("postgresql://", "postgresql+psycopg2://")

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security - JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Encryption
    ENCRYPTION_KEY: str  # Fernet key for SSH credentials

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    def get_allowed_origins(self) -> List[str]:
        """Parse ALLOWED_ORIGINS string to list"""
        if isinstance(self.ALLOWED_ORIGINS, str):
            return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
        return self.ALLOWED_ORIGINS

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # Ansible
    ANSIBLE_PLAYBOOKS_PATH: str = "../ansible/playbooks"
    ANSIBLE_ROLES_PATH: str = "../ansible/roles"
    ANSIBLE_HOST_KEY_CHECKING: bool = False

    # SSH
    SSH_KEYS_DIR: str = "./ssh_keys"
    SSH_CONNECTION_TIMEOUT: int = 30

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    CELERY_TASK_TRACK_STARTED: bool = True
    CELERY_TASK_TIME_LIMIT: int = 3600

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    # Admin user
    ADMIN_EMAIL: str = "admin@k8s-provisioner.local"
    ADMIN_PASSWORD: str = "AdminPassword123!"
    ADMIN_FULL_NAME: str = "Administrator"

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    RATE_LIMIT_PER_HOUR: int = 1000

    # File upload
    MAX_UPLOAD_SIZE_MB: int = 10

    # Job configuration
    MAX_CONCURRENT_JOBS: int = 5
    JOB_TIMEOUT_MINUTES: int = 120
    JOB_RETRY_ATTEMPTS: int = 3

    # Kubernetes defaults
    DEFAULT_K8S_VERSION: str = "1.28.3"
    SUPPORTED_K8S_VERSIONS: str = "1.26.0,1.27.0,1.28.0,1.28.1,1.28.2,1.28.3"

    def get_supported_k8s_versions(self) -> List[str]:
        """Parse K8s versions string to list"""
        if isinstance(self.SUPPORTED_K8S_VERSIONS, str):
            return [v.strip() for v in self.SUPPORTED_K8S_VERSIONS.split(",")]
        return self.SUPPORTED_K8S_VERSIONS

    # CNI defaults
    DEFAULT_CNI: str = "calico"
    SUPPORTED_CNI_PLUGINS: str = "calico,cilium,flannel"

    def get_supported_cni_plugins(self) -> List[str]:
        """Parse CNI plugins string to list"""
        if isinstance(self.SUPPORTED_CNI_PLUGINS, str):
            return [p.strip() for p in self.SUPPORTED_CNI_PLUGINS.split(",")]
        return self.SUPPORTED_CNI_PLUGINS

    # Ingress defaults
    DEFAULT_INGRESS: str = "nginx"
    SUPPORTED_INGRESS_CONTROLLERS: str = "nginx,haproxy,traefik"

    def get_supported_ingress_controllers(self) -> List[str]:
        """Parse ingress controllers string to list"""
        if isinstance(self.SUPPORTED_INGRESS_CONTROLLERS, str):
            return [c.strip() for c in self.SUPPORTED_INGRESS_CONTROLLERS.split(",")]
        return self.SUPPORTED_INGRESS_CONTROLLERS

    # Container runtime
    DEFAULT_CONTAINER_RUNTIME: str = "containerd"
    SUPPORTED_CONTAINER_RUNTIMES: str = "containerd"

    def get_supported_container_runtimes(self) -> List[str]:
        """Parse container runtimes string to list"""
        if isinstance(self.SUPPORTED_CONTAINER_RUNTIMES, str):
            return [r.strip() for r in self.SUPPORTED_CONTAINER_RUNTIMES.split(",")]
        return self.SUPPORTED_CONTAINER_RUNTIMES

    # Hardening
    ENABLE_CIS_K8S_BENCHMARK: bool = True
    ENABLE_CIS_LINUX_BENCHMARK: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
