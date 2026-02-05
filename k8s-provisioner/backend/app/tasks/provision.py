"""
Cluster provisioning Celery task
"""
import asyncio
import os
import tempfile
import subprocess
from datetime import datetime
from sqlalchemy import select
from app.tasks.worker import celery_app
from app.db.base import AsyncSessionLocal
from app.models.models import Cluster, Node, SSHCredential, Job, JobLog, JobStatus
from app.core.security import decrypt_secret
from app.core.config import settings


@celery_app.task(bind=True, name="provision_cluster")
def provision_cluster_task(self, cluster_id: str, job_id: str):
    """
    Provision a Kubernetes cluster using Ansible
    """
    # Run async provisioning
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(_provision_cluster(self, cluster_id, job_id))


async def _provision_cluster(task, cluster_id: str, job_id: str):
    """Async cluster provisioning logic"""
    async with AsyncSessionLocal() as db:
        # Get cluster
        result = await db.execute(select(Cluster).where(Cluster.id == cluster_id))
        cluster = result.scalar_one_or_none()

        if not cluster:
            return {"status": "error", "message": "Cluster not found"}

        # Get job
        result = await db.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()

        if not job:
            return {"status": "error", "message": "Job not found"}

        # Update job status
        job.status = JobStatus.RUNNING
        job.started_at = datetime.utcnow()
        await db.commit()

        # Get nodes
        result = await db.execute(select(Node).where(Node.cluster_id == cluster_id))
        nodes = result.scalars().all()

        # Get SSH credentials
        result = await db.execute(
            select(SSHCredential).where(SSHCredential.cluster_id == cluster_id)
        )
        ssh_cred = result.scalar_one_or_none()

        if not ssh_cred:
            job.status = JobStatus.FAILED
            job.error_message = "SSH credentials not found"
            job.completed_at = datetime.utcnow()
            await db.commit()
            return {"status": "error", "message": "SSH credentials not found"}

        # Decrypt SSH credentials
        private_key = None
        password = None
        if ssh_cred.private_key_encrypted:
            private_key = decrypt_secret(ssh_cred.private_key_encrypted)
        if ssh_cred.password_encrypted:
            password = decrypt_secret(ssh_cred.password_encrypted)

        # Define provisioning phases
        phases = [
            {"name": "Preflight Checks", "playbook": "preflight_check.yml"},
            {"name": "System Hardening", "playbook": "system_hardening.yml"},
            {"name": "Install Container Runtime", "playbook": "install_containerd.yml"},
            {"name": "Install Kubernetes Components", "playbook": "install_kubernetes.yml"},
            {"name": "Initialize Control Plane", "playbook": "init_control_plane.yml"},
            {"name": "Join Worker Nodes", "playbook": "join_workers.yml"},
            {"name": "Install CNI", "playbook": f"install_cni_{cluster.components.get('cni', 'calico')}.yml"},
            {"name": "Install Ingress", "playbook": f"install_ingress_{cluster.components.get('ingress', 'nginx')}.yml"},
            {"name": "Final Validation", "playbook": "final_validation.yml"},
        ]

        # Conditionally add Additional Kubernetes Configuration phase
        hardening_config = cluster.hardening_config or {}
        if hardening_config.get("additional_k8s_config", False):
            phases.append({
                "name": "Additional Kubernetes Configuration",
                "playbook": "configure_kubelet.yml",
            })

        job.phases = phases
        await db.commit()

        # Create temporary SSH key file
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.pem') as key_file:
            if private_key:
                key_file.write(private_key)
                key_file_path = key_file.name
                os.chmod(key_file_path, 0o600)
            else:
                key_file_path = None

        try:
            # Create Ansible inventory
            inventory = _create_ansible_inventory(nodes, ssh_cred.username, key_file_path, password)
            inventory_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.ini')
            inventory_file.write(inventory)
            inventory_file.close()

            # Execute each phase
            for idx, phase in enumerate(phases):
                # Update current phase
                job.current_phase = phase["name"]
                job.progress = int((idx / len(phases)) * 100)
                phases[idx]["status"] = "running"
                phases[idx]["started_at"] = datetime.utcnow().isoformat()
                job.phases = phases
                await db.commit()

                # Log phase start
                log = JobLog(
                    job_id=job.id,
                    level="info",
                    message=f"Starting phase: {phase['name']}",
                    phase=phase["name"],
                )
                db.add(log)
                await db.commit()

                # Run Ansible playbook
                playbook_path = os.path.join(
                    settings.ANSIBLE_PLAYBOOKS_PATH,
                    phase["playbook"]
                )

                success = await _run_ansible_playbook(
                    playbook_path,
                    inventory_file.name,
                    cluster,
                    job,
                    db,
                )

                # Update phase status
                phases[idx]["completed_at"] = datetime.utcnow().isoformat()
                phases[idx]["status"] = "success" if success else "failed"
                job.phases = phases
                await db.commit()

                if not success:
                    job.status = JobStatus.FAILED
                    job.error_message = f"Failed at phase: {phase['name']}"
                    job.completed_at = datetime.utcnow()
                    cluster.status = "failed"
                    await db.commit()
                    return {"status": "error", "message": f"Failed at phase: {phase['name']}"}

            # Mark job as successful
            job.status = JobStatus.SUCCESS
            job.progress = 100
            job.completed_at = datetime.utcnow()
            cluster.status = "running"
            await db.commit()

            # Cleanup temp files
            if key_file_path:
                os.unlink(key_file_path)
            os.unlink(inventory_file.name)

            return {"status": "success", "message": "Cluster provisioned successfully"}

        except Exception as e:
            job.status = JobStatus.FAILED
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            cluster.status = "failed"
            await db.commit()

            # Cleanup temp files
            if key_file_path and os.path.exists(key_file_path):
                os.unlink(key_file_path)

            return {"status": "error", "message": str(e)}


def _create_ansible_inventory(nodes, username, key_file_path, password=None):
    """Create Ansible inventory from nodes"""
    inventory_lines = []

    # Control plane nodes
    inventory_lines.append("[control_plane]")
    for node in nodes:
        if node.role == "control-plane":
            line = f"{node.name} ansible_host={node.ip_address} ansible_port={node.ssh_port} ansible_user={username}"
            if key_file_path:
                line += f" ansible_ssh_private_key_file={key_file_path}"
            if password:
                line += f" ansible_ssh_pass={password}"
            inventory_lines.append(line)

    inventory_lines.append("")

    # Worker nodes
    inventory_lines.append("[workers]")
    for node in nodes:
        if node.role == "worker":
            line = f"{node.name} ansible_host={node.ip_address} ansible_port={node.ssh_port} ansible_user={username}"
            if key_file_path:
                line += f" ansible_ssh_private_key_file={key_file_path}"
            if password:
                line += f" ansible_ssh_pass={password}"
            inventory_lines.append(line)

    inventory_lines.append("")
    inventory_lines.append("[k8s_cluster:children]")
    inventory_lines.append("control_plane")
    inventory_lines.append("workers")

    # Add common variables
    inventory_lines.append("")
    inventory_lines.append("[all:vars]")
    inventory_lines.append("ansible_ssh_common_args='-o StrictHostKeyChecking=no'")

    return "\n".join(inventory_lines)


async def _run_ansible_playbook(playbook_path, inventory_path, cluster, job, db):
    """Run Ansible playbook and capture output"""
    try:
        # Build ansible-playbook command
        cmd = [
            "ansible-playbook",
            playbook_path,
            "-i", inventory_path,
            "--extra-vars", f"k8s_version={cluster.kubernetes_version}",
            "--extra-vars", f"cni_plugin={cluster.components.get('cni', 'calico')}",
        ]

        # Set environment for Ansible
        env = os.environ.copy()
        env["ANSIBLE_HOST_KEY_CHECKING"] = "False"
        env["ANSIBLE_STDOUT_CALLBACK"] = "yaml"

        # Run playbook
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            env=env,
        )

        # Stream output and log
        for line in process.stdout:
            line = line.strip()
            if line:
                log = JobLog(
                    job_id=job.id,
                    level="info",
                    message=line,
                    phase=job.current_phase,
                )
                db.add(log)
                await db.commit()

        process.wait()
        return process.returncode == 0

    except Exception as e:
        log = JobLog(
            job_id=job.id,
            level="error",
            message=f"Error running playbook: {str(e)}",
            phase=job.current_phase,
        )
        db.add(log)
        await db.commit()
        return False
