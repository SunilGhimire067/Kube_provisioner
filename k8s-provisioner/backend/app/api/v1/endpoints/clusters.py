"""
Cluster management endpoints
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.base import get_db
from app.models.models import Cluster, Node, SSHCredential, User, Job, JobType, JobStatus
from app.api.v1.endpoints.auth import get_current_user
from app.core.security import encrypt_secret
from app.tasks import provision_cluster_task
from pydantic import BaseModel
from datetime import datetime
import paramiko
import socket


router = APIRouter()


# Schemas
class NodeCreate(BaseModel):
    name: str
    role: str
    ip_address: str
    ssh_port: int = 22
    os_type: str


class SSHConfig(BaseModel):
    username: str
    auth_method: str
    private_key: str | None = None
    passphrase: str | None = None
    password: str | None = None


class ClusterCreate(BaseModel):
    name: str
    description: str | None = None
    template_id: str | None = None
    topology: dict
    components: dict
    nodes: List[NodeCreate]
    ssh_config: SSHConfig
    hardening: dict | None = None
    provision_immediately: bool = True


class SSHTestRequest(BaseModel):
    nodes: List[NodeCreate]
    ssh_config: SSHConfig


class ClusterResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    status: str
    kubernetes_version: str | None
    topology: dict
    components: dict
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True
        json_encoders = {
            UUID: str
        }


class ClusterListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    data: List[ClusterResponse]


@router.post("/test-ssh")
async def test_ssh_connection(
    request: SSHTestRequest,
    current_user: User = Depends(get_current_user),
):
    """Test SSH connection to nodes"""
    results = []

    for node in request.nodes:
        result = {
            "node": node.name,
            "ip_address": node.ip_address,
            "success": False,
            "message": ""
        }

        try:
            # Create SSH client
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

            # Prepare connection parameters
            connect_params = {
                "hostname": node.ip_address,
                "port": node.ssh_port,
                "username": request.ssh_config.username,
                "timeout": 10,
                "allow_agent": False,
                "look_for_keys": False,
            }

            # Add authentication
            if request.ssh_config.auth_method == "password" and request.ssh_config.password:
                connect_params["password"] = request.ssh_config.password
            elif request.ssh_config.auth_method == "private_key" and request.ssh_config.private_key:
                import io
                key_file = io.StringIO(request.ssh_config.private_key)
                try:
                    pkey = paramiko.RSAKey.from_private_key(key_file)
                except:
                    key_file.seek(0)
                    try:
                        pkey = paramiko.Ed25519Key.from_private_key(key_file)
                    except:
                        key_file.seek(0)
                        pkey = paramiko.ECDSAKey.from_private_key(key_file)
                connect_params["pkey"] = pkey
                if request.ssh_config.passphrase:
                    connect_params["passphrase"] = request.ssh_config.passphrase

            # Connect
            client.connect(**connect_params)

            # Test command
            stdin, stdout, stderr = client.exec_command("hostname")
            hostname = stdout.read().decode().strip()

            result["success"] = True
            result["message"] = f"Connected successfully. Hostname: {hostname}"

            client.close()

        except paramiko.AuthenticationException as e:
            result["message"] = f"Authentication failed: {str(e)}"
        except paramiko.SSHException as e:
            result["message"] = f"SSH error: {str(e)}"
        except socket.timeout:
            result["message"] = "Connection timed out"
        except socket.error as e:
            result["message"] = f"Network error: {str(e)}"
        except Exception as e:
            result["message"] = f"Error: {str(e)}"

        results.append(result)

    # Check if all nodes succeeded
    all_success = all(r["success"] for r in results)

    return {
        "success": all_success,
        "results": results
    }


@router.get("", response_model=ClusterListResponse)
async def list_clusters(
    page: int = 1,
    page_size: int = 20,
    status_filter: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all clusters with pagination"""
    # Build query
    query = select(Cluster)

    # Apply filters
    if status_filter and status_filter != "all":
        query = query.where(Cluster.status == status_filter)

    # Get total count
    count_query = select(func.count()).select_from(Cluster)
    if status_filter and status_filter != "all":
        count_query = count_query.where(Cluster.status == status_filter)

    result = await db.execute(count_query)
    total = result.scalar()

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    # Execute query
    result = await db.execute(query)
    clusters = result.scalars().all()

    total_pages = (total + page_size - 1) // page_size

    return ClusterListResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        data=clusters,
    )


@router.get("/{cluster_id}", response_model=ClusterResponse)
async def get_cluster(
    cluster_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get cluster details"""
    result = await db.execute(select(Cluster).where(Cluster.id == cluster_id))
    cluster = result.scalar_one_or_none()

    if not cluster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cluster not found",
        )

    return cluster


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_cluster(
    cluster_data: ClusterCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new cluster"""
    # Check if cluster name exists
    result = await db.execute(select(Cluster).where(Cluster.name == cluster_data.name))
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cluster name already exists",
        )

    # Create cluster
    cluster = Cluster(
        name=cluster_data.name,
        description=cluster_data.description,
        kubernetes_version=cluster_data.components.get("kubernetes_version"),
        topology=cluster_data.topology,
        components=cluster_data.components,
        hardening_config=cluster_data.hardening,
        created_by=current_user.id,
    )

    db.add(cluster)
    await db.flush()  # Get cluster ID

    # Create nodes
    for node_data in cluster_data.nodes:
        node = Node(
            cluster_id=cluster.id,
            name=node_data.name,
            role=node_data.role,
            ip_address=node_data.ip_address,
            ssh_port=node_data.ssh_port,
            os_type=node_data.os_type,
        )
        db.add(node)

    # Create SSH credentials (encrypted)
    ssh_cred = SSHCredential(
        cluster_id=cluster.id,
        username=cluster_data.ssh_config.username,
        auth_method=cluster_data.ssh_config.auth_method,
    )

    if cluster_data.ssh_config.private_key:
        ssh_cred.private_key_encrypted = encrypt_secret(cluster_data.ssh_config.private_key)

    if cluster_data.ssh_config.passphrase:
        ssh_cred.passphrase_encrypted = encrypt_secret(cluster_data.ssh_config.passphrase)

    if cluster_data.ssh_config.password:
        ssh_cred.password_encrypted = encrypt_secret(cluster_data.ssh_config.password)

    db.add(ssh_cred)

    # Create provisioning job if requested
    job = None
    if cluster_data.provision_immediately:
        job = Job(
            cluster_id=cluster.id,
            type=JobType.PROVISION,
            status=JobStatus.QUEUED,
            created_by=current_user.id,
        )
        db.add(job)
        await db.flush()

        # Queue Celery task
        task = provision_cluster_task.delay(str(cluster.id), str(job.id))
        job.celery_task_id = task.id

    await db.commit()
    await db.refresh(cluster)

    response = {
        "cluster": {
            "id": str(cluster.id),
            "name": cluster.name,
            "status": cluster.status,
            "created_at": cluster.created_at.isoformat(),
        }
    }

    if job:
        response["job"] = {
            "id": str(job.id),
            "type": job.type,
            "status": job.status,
            "created_at": job.created_at.isoformat(),
        }

    return response


@router.delete("/{cluster_id}", status_code=status.HTTP_202_ACCEPTED)
async def delete_cluster(
    cluster_id: UUID,
    deprovision: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a cluster"""
    result = await db.execute(select(Cluster).where(Cluster.id == cluster_id))
    cluster = result.scalar_one_or_none()

    if not cluster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cluster not found",
        )

    # Check permissions (only creator or admin can delete)
    if cluster.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    if deprovision:
        # Create deprovision job
        job = Job(
            cluster_id=cluster.id,
            type=JobType.DEPROVISION,
            status=JobStatus.QUEUED,
            created_by=current_user.id,
        )
        db.add(job)
        await db.commit()

        return {
            "message": "Cluster deletion initiated",
            "cluster_id": str(cluster_id),
            "job_id": str(job.id),
        }
    else:
        # Mark as deleted (soft delete)
        cluster.status = "deleted"
        await db.commit()

        return {
            "message": "Cluster marked as deleted",
            "cluster_id": str(cluster_id),
        }


@router.get("/{cluster_id}/kubeconfig")
async def get_kubeconfig(
    cluster_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download kubeconfig file"""
    result = await db.execute(select(Cluster).where(Cluster.id == cluster_id))
    cluster = result.scalar_one_or_none()

    if not cluster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cluster not found",
        )

    if not cluster.kubeconfig:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kubeconfig not available yet",
        )

    # Return kubeconfig (decrypt if encrypted)
    from fastapi.responses import PlainTextResponse

    return PlainTextResponse(
        content=cluster.kubeconfig,
        media_type="application/x-yaml",
        headers={
            "Content-Disposition": f'attachment; filename="{cluster.name}-kubeconfig.yaml"'
        },
    )
