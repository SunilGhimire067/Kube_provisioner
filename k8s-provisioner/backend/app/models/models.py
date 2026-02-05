"""
SQLAlchemy database models
"""
import uuid
from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    String,
    Integer,
    Text,
    DateTime,
    ForeignKey,
    Enum,
    JSON,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base
import enum


# Enums
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    OPERATOR = "operator"
    VIEWER = "viewer"


class ClusterStatus(str, enum.Enum):
    PENDING = "pending"
    PROVISIONING = "provisioning"
    RUNNING = "running"
    FAILED = "failed"
    DELETED = "deleted"


class NodeRole(str, enum.Enum):
    CONTROL_PLANE = "control-plane"
    WORKER = "worker"


class NodeStatus(str, enum.Enum):
    PENDING = "pending"
    READY = "ready"
    NOT_READY = "not_ready"
    UNKNOWN = "unknown"


class JobType(str, enum.Enum):
    PROVISION = "provision"
    SCALE = "scale"
    UPGRADE = "upgrade"
    DEPROVISION = "deprovision"


class JobStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"


class OSType(str, enum.Enum):
    ROCKY9 = "rocky9"
    UBUNTU22 = "ubuntu22"
    RHEL9 = "rhel9"


class AuthMethod(str, enum.Enum):
    PRIVATE_KEY = "private_key"
    PASSWORD = "password"


class LogLevel(str, enum.Enum):
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


class TemplateType(str, enum.Enum):
    USER = "user"
    SYSTEM = "system"


# Models
class User(Base):
    """User model"""

    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.VIEWER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    clusters = relationship("Cluster", back_populates="creator")
    jobs = relationship("Job", back_populates="creator")
    audit_logs = relationship("AuditLog", back_populates="user")
    templates = relationship("Template", back_populates="creator")


class Cluster(Base):
    """Cluster model"""

    __tablename__ = "clusters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(Enum(ClusterStatus), nullable=False, default=ClusterStatus.PENDING)
    kubernetes_version = Column(String(20), nullable=False)
    topology = Column(JSON, nullable=False)  # {ha, control_plane_count, worker_count}
    components = Column(JSON, nullable=False)  # {cni, ingress, runtime, etc.}
    hardening_config = Column(JSON, nullable=True)
    kubeconfig = Column(Text, nullable=True)  # encrypted
    template_id = Column(UUID(as_uuid=True), ForeignKey("templates.id"), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    nodes = relationship("Node", back_populates="cluster", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="cluster")
    ssh_credential = relationship(
        "SSHCredential", back_populates="cluster", uselist=False, cascade="all, delete-orphan"
    )
    creator = relationship("User", back_populates="clusters")
    template = relationship("Template", back_populates="clusters")


class Node(Base):
    """Node model"""

    __tablename__ = "nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cluster_id = Column(UUID(as_uuid=True), ForeignKey("clusters.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(Enum(NodeRole), nullable=False)
    ip_address = Column(String(45), nullable=False)  # IPv4 or IPv6
    ssh_port = Column(Integer, default=22)
    os_type = Column(Enum(OSType), nullable=False)
    status = Column(Enum(NodeStatus), default=NodeStatus.PENDING)
    kubernetes_version = Column(String(20), nullable=True)
    container_runtime = Column(String(100), nullable=True)
    kernel_version = Column(String(100), nullable=True)
    os_image = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    cluster = relationship("Cluster", back_populates="nodes")


class SSHCredential(Base):
    """SSH credentials model"""

    __tablename__ = "ssh_credentials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cluster_id = Column(
        UUID(as_uuid=True), ForeignKey("clusters.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    username = Column(String(100), nullable=False)
    auth_method = Column(Enum(AuthMethod), nullable=False)
    private_key_encrypted = Column(Text, nullable=True)  # Fernet encrypted
    password_encrypted = Column(String(255), nullable=True)  # Fernet encrypted
    passphrase_encrypted = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    cluster = relationship("Cluster", back_populates="ssh_credential")


class Template(Base):
    """Cluster template model"""

    __tablename__ = "templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(Enum(TemplateType), nullable=False, default=TemplateType.USER)
    config = Column(JSON, nullable=False)
    usage_count = Column(Integer, default=0)
    last_used = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    creator = relationship("User", back_populates="templates")
    clusters = relationship("Cluster", back_populates="template")


class Job(Base):
    """Job model"""

    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cluster_id = Column(UUID(as_uuid=True), ForeignKey("clusters.id", ondelete="CASCADE"), nullable=False)
    type = Column(Enum(JobType), nullable=False)
    status = Column(Enum(JobStatus), default=JobStatus.QUEUED)
    progress = Column(Integer, default=0)  # 0-100
    current_phase = Column(String(255), nullable=True)
    phases = Column(JSON, nullable=True)  # Array of phase objects
    error_message = Column(Text, nullable=True)
    celery_task_id = Column(String(255), nullable=True, index=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    cluster = relationship("Cluster", back_populates="jobs")
    logs = relationship("JobLog", back_populates="job", cascade="all, delete-orphan")
    creator = relationship("User", back_populates="jobs")


class JobLog(Base):
    """Job log model"""

    __tablename__ = "job_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    level = Column(Enum(LogLevel), default=LogLevel.INFO)
    message = Column(Text, nullable=False)
    node = Column(String(255), nullable=True)
    phase = Column(String(255), nullable=True)

    # Relationships
    job = relationship("Job", back_populates="logs")


class AuditLog(Base):
    """Audit log model"""

    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(255), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
