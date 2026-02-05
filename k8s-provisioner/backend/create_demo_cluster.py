"""
Script to create a demo cluster in the database for demonstration purposes
"""
import asyncio
import uuid
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import encrypt_secret
from app.models.models import (
    Cluster, Node, SSHCredential, Job, JobLog,
    ClusterStatus, NodeRole, NodeStatus, JobType, JobStatus, AuthMethod, OSType
)


async def create_demo_cluster():
    """Create a complete demo cluster with nodes and job history"""

    # Create async engine
    engine = create_async_engine(str(settings.DATABASE_URL), echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        print("Creating demo cluster...")

        # Get admin user ID
        from sqlalchemy import select
        from app.models.models import User
        result = await session.execute(select(User).where(User.email == settings.ADMIN_EMAIL))
        admin_user = result.scalar_one_or_none()

        if not admin_user:
            print("❌ Admin user not found. Please create admin user first.")
            return

        # Check if demo cluster already exists
        result = await session.execute(
            select(Cluster).where(Cluster.name == "demo-dev-cluster")
        )
        existing_cluster = result.scalar_one_or_none()

        if existing_cluster:
            print("⚠️  Demo cluster already exists. Skipping creation.")
            print(f"Cluster ID: {existing_cluster.id}")
            return

        # Create demo cluster
        cluster_id = uuid.uuid4()
        cluster = Cluster(
            id=cluster_id,
            name="demo-dev-cluster",
            description="Demo development cluster for testing and demonstration",
            status=ClusterStatus.RUNNING,
            kubernetes_version="1.28.3",
            topology={
                "ha": False,
                "control_plane_count": 1,
                "worker_count": 2
            },
            components={
                "cni": "calico",
                "ingress": "nginx",
                "runtime": "containerd",
                "monitoring": True,
                "logging": False
            },
            hardening_config={
                "cis_k8s_benchmark": True,
                "cis_linux_benchmark": True,
                "pod_security_standards": "restricted"
            },
            created_by=admin_user.id,
            created_at=datetime.utcnow() - timedelta(hours=2),
            updated_at=datetime.utcnow(),
        )
        session.add(cluster)

        print(f"✓ Created cluster: {cluster.name} (ID: {cluster.id})")

        # Create SSH credentials for nodes
        ssh_cred_id = uuid.uuid4()
        ssh_credential = SSHCredential(
            id=ssh_cred_id,
            cluster_id=cluster_id,
            username="ubuntu",
            auth_method=AuthMethod.PASSWORD,
            password_encrypted=encrypt_secret("demo-password-123"),
            created_at=datetime.utcnow() - timedelta(hours=2),
        )
        session.add(ssh_credential)

        print(f"✓ Created SSH credentials")

        # Create control plane node
        master_node = Node(
            id=uuid.uuid4(),
            cluster_id=cluster_id,
            name="k8s-master-demo",
            ip_address="192.168.100.10",
            role=NodeRole.CONTROL_PLANE,
            status=NodeStatus.READY,
            os_type=OSType.UBUNTU22,
            created_at=datetime.utcnow() - timedelta(hours=2),
            updated_at=datetime.utcnow(),
        )
        session.add(master_node)
        print(f"✓ Created control plane node: {master_node.name}")

        # Create worker nodes
        worker_nodes = []
        for i in range(1, 3):
            worker = Node(
                id=uuid.uuid4(),
                cluster_id=cluster_id,
                name=f"k8s-worker-demo-{i:02d}",
                ip_address=f"192.168.100.{10+i}",
                role=NodeRole.WORKER,
                status=NodeStatus.READY,
                os_type=OSType.UBUNTU22,
                created_at=datetime.utcnow() - timedelta(hours=2),
                updated_at=datetime.utcnow(),
            )
            session.add(worker)
            worker_nodes.append(worker)
            print(f"✓ Created worker node: {worker.name}")

        # Create provisioning job (completed)
        job_id = uuid.uuid4()
        job = Job(
            id=job_id,
            cluster_id=cluster_id,
            type=JobType.PROVISION,
            status=JobStatus.SUCCESS,
            progress=100,
            current_phase="completed",
            celery_task_id=str(uuid.uuid4()),
            created_by=admin_user.id,
            started_at=datetime.utcnow() - timedelta(hours=2),
            completed_at=datetime.utcnow() - timedelta(minutes=45),
        )
        session.add(job)
        print(f"✓ Created provisioning job (ID: {job.id})")

        # Create job logs to show the provisioning process
        log_phases = [
            ("preflight_check", "Starting preflight checks...", 0),
            ("preflight_check", "✓ SSH connectivity verified for all nodes", 5),
            ("preflight_check", "✓ System requirements validated", 10),
            ("system_hardening", "Applying CIS Linux benchmarks...", 15),
            ("system_hardening", "✓ Firewall configured on all nodes", 25),
            ("system_hardening", "✓ Swap disabled on all nodes", 30),
            ("container_runtime", "Installing containerd on all nodes...", 35),
            ("container_runtime", "✓ Container runtime installed and configured", 40),
            ("kubernetes_base", "Installing Kubernetes components...", 45),
            ("kubernetes_base", "✓ kubeadm, kubelet, kubectl installed", 55),
            ("control_plane_init", "Initializing control plane node...", 60),
            ("control_plane_init", "✓ Control plane initialized successfully", 65),
            ("worker_join", "Joining worker nodes to cluster...", 70),
            ("worker_join", "✓ k8s-worker-demo-01 joined successfully", 75),
            ("worker_join", "✓ k8s-worker-demo-02 joined successfully", 80),
            ("cni_install", "Installing Calico CNI plugin...", 85),
            ("cni_install", "✓ CNI plugin installed and configured", 90),
            ("ingress_install", "Installing NGINX ingress controller...", 95),
            ("ingress_install", "✓ Ingress controller deployed successfully", 98),
            ("completed", "✅ Cluster provisioning completed successfully!", 100),
        ]

        start_time = datetime.utcnow() - timedelta(hours=2)
        for i, (phase, message, progress) in enumerate(log_phases):
            log_time = start_time + timedelta(minutes=i * 3)
            log = JobLog(
                id=uuid.uuid4(),
                job_id=job_id,
                phase=phase,
                message=message,
                level="info",
                timestamp=log_time,
            )
            session.add(log)

        print(f"✓ Created {len(log_phases)} job log entries")

        # Commit all changes
        await session.commit()

        print("\n" + "="*60)
        print("✅ Demo cluster created successfully!")
        print("="*60)
        print(f"\nCluster Details:")
        print(f"  Name: {cluster.name}")
        print(f"  ID: {cluster.id}")
        print(f"  Status: {cluster.status.value}")
        print(f"  K8s Version: {cluster.kubernetes_version}")
        print(f"  CNI: {cluster.components['cni']}")
        print(f"  Ingress: {cluster.components['ingress']}")
        print(f"\nNodes:")
        print(f"  • {master_node.name} ({master_node.ip_address}) - {master_node.role.value}")
        for worker in worker_nodes:
            print(f"  • {worker.name} ({worker.ip_address}) - {worker.role.value}")
        print(f"\nJob:")
        print(f"  • Provisioning job: {job.status.value} ({job.progress}%)")
        print("\n" + "="*60)
        print("\n📋 Next Steps:")
        print("  1. View in UI: http://localhost:3001 (login and go to Clusters)")
        print("  2. View via API: http://localhost:8000/docs")
        print(f"  3. Get cluster details: GET /api/v1/clusters/{cluster.id}")
        print("\n" + "="*60)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_demo_cluster())
