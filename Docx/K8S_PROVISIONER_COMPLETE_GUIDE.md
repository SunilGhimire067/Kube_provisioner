# Kubernetes Provisioner Platform - Complete Guide

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Prerequisites](#3-prerequisites)
4. [LAB Environment Setup](#4-lab-environment-setup)
5. [Platform Setup (Docker Services)](#5-platform-setup-docker-services)
6. [Issues Found & Fixes Applied](#6-issues-found--fixes-applied)
7. [Ansible Playbooks](#7-ansible-playbooks)
8. [Creating a Cluster](#8-creating-a-cluster)
9. [Monitoring & Dashboards](#9-monitoring--dashboards)
10. [API Reference](#10-api-reference)
11. [UI Flow](#11-ui-flow)
12. [Environment Variables](#12-environment-variables)
13. [Troubleshooting](#13-troubleshooting)
14. [Project File Structure](#14-project-file-structure)
15. [Portability & Deployment on Any Server](#15-portability--deployment-on-any-server)

---

## 1. Project Overview

The **Kubernetes Provisioner Platform** is a production-grade, UI-driven tool that automates Kubernetes cluster deployment on bare-metal or VM infrastructure using Ansible.

### Key Features
- **Web UI** (React) for cluster creation via a step-by-step wizard
- **REST API** (FastAPI) for programmatic cluster management
- **Async Provisioning** via Celery + Redis task queue
- **Ansible Playbooks** for each provisioning phase
- **SSH Connectivity Testing** before deployment
- **Real-time Progress Monitoring** via Flower dashboard and job logs
- **Security Hardening** with CIS benchmarks
- **Kubeconfig Download** after successful provisioning

### Tech Stack
| Component | Technology |
|-----------|------------|
| Frontend | React 18, Material UI, TypeScript |
| Backend | FastAPI (Python 3.11), SQLAlchemy, Pydantic |
| Database | PostgreSQL 15 |
| Task Queue | Celery 5.x with Redis 7 broker |
| Provisioning | Ansible 2.16 with custom playbooks |
| Container Runtime | containerd (installed on target nodes) |
| Monitoring | Celery Flower |
| Auth | JWT (HS256) with bcrypt password hashing |
| Encryption | Fernet (SSH credentials at rest) |

---

## 2. Architecture

### System Components

```
User Browser
    |
    v
React Frontend (port 3001)
    |
    v (REST API calls)
FastAPI Backend (port 8000)
    |
    +---> PostgreSQL (port 5432) - clusters, nodes, jobs, users
    +---> Redis (port 6379) - task broker & result backend
    |
    v (task dispatch)
Celery Worker
    |
    v (SSH + Ansible)
Target VMs (192.168.56.10/20/21)
```

### Docker Services (7 containers)

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| postgres | k8s-prov-postgres | 5432 | Database |
| redis | k8s-prov-redis | 6379 | Task broker & cache |
| backend | k8s-prov-backend | 8000 | FastAPI REST API |
| celery-worker | k8s-prov-celery-worker | - | Runs Ansible playbooks |
| celery-beat | k8s-prov-celery-beat | - | Scheduled tasks |
| flower | k8s-prov-flower | 5555 | Task monitoring UI |
| frontend | k8s-prov-frontend | 3001 | React Web UI |

### Provisioning Flow
1. User fills cluster wizard in React UI (nodes, SSH config, components)
2. Frontend POSTs to `/api/v1/clusters` endpoint
3. Backend creates Cluster, Node, SSHCredential records in PostgreSQL
4. Backend queues `provision_cluster` Celery task
5. Celery worker picks up task, generates Ansible inventory
6. Worker executes 9 Ansible playbooks sequentially
7. Each phase logs output to `job_logs` table
8. On success, cluster status is set to `RUNNING`

---

## 3. Prerequisites

### Software Required on Host Machine (macOS)
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install vagrant
brew install --cask virtualbox
brew install docker
brew install jq  # optional, for API testing
```

### Hardware Requirements
- **Host Machine**: 16GB+ RAM recommended (VMs + Docker need ~12GB)
- **Disk**: 30GB+ free space for VM images and Docker volumes

### VMs (created by Vagrant)
| Node | IP | RAM | CPU | Role |
|------|----|-----|-----|------|
| k8s-cp-1 | 192.168.56.10 | 4096 MB | 2 cores | Control Plane |
| k8s-worker-1 | 192.168.56.20 | 2048 MB | 2 cores | Worker |
| k8s-worker-2 | 192.168.56.21 | 2048 MB | 2 cores | Worker |

---

## 4. LAB Environment Setup

### Step 1: Start the VMs

```bash
cd /path/to/LIVE_K8S
vagrant up
```

The Vagrantfile uses `bento/rockylinux-9` box and configures:
- VirtualBox host-only network (192.168.56.0/24)
- Synced folders disabled (avoids iCloud Drive permission errors)
- SELinux disabled, firewalld disabled (LAB only)
- Root SSH password authentication enabled (password: `vagrant`)

### Step 2: Verify VM Access

```bash
# Check VM status
vagrant status

# Test SSH connectivity
for ip in 192.168.56.10 192.168.56.20 192.168.56.21; do
  echo -n "Testing $ip... "
  ping -c 1 -W 1 $ip >/dev/null 2>&1 && echo "OK" || echo "FAILED"
done

# SSH into control plane
vagrant ssh k8s-cp-1
# OR directly:
ssh root@192.168.56.10  # password: vagrant
```

### Step 3: VM Credentials
| User | Password | Purpose |
|------|----------|---------|
| vagrant | vagrant | Default Vagrant user |
| root | vagrant | Used by provisioner for Ansible |

---

## 5. Platform Setup (Docker Services)

### Step 1: Start All Services

```bash
cd k8s-provisioner
docker-compose up -d
```

### Step 2: Initialize Database

The database auto-initializes on first run. Verify with:
```bash
docker exec k8s-prov-postgres psql -U k8s_provisioner -d k8s_provisioner \
  -c "SELECT email, role FROM users;"
```

### Step 3: Verify All Services

```bash
docker-compose ps
```

Expected output: all 7 containers running, postgres and redis healthy.

### Step 4: Access Points

| Service | URL |
|---------|-----|
| Frontend UI | http://localhost:3001 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Flower Dashboard | http://localhost:5555 |

### Step 5: Login Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@k8s-provisioner.local | AdminPassword123! | admin |

---

## 6. Issues Found & Fixes Applied

### Issue 1: Vagrant Box Download Timeout
**Problem**: `generic/rocky9` box was slow/unavailable.
**Fix**: Changed to `bento/rockylinux-9` in Vagrantfile.

### Issue 2: Vagrant Synced Folder EPERM Error
**Problem**: `EPERM` error when Vagrant tried to sync folders from iCloud Drive.
**Fix**: Added `config.vm.synced_folder ".", "/vagrant", disabled: true` to Vagrantfile.

### Issue 3: SSH Key Path Error
**Problem**: Vagrant SSH failed because `~/.ssh/id_rsa` didn't exist.
**Fix**: Changed SSH config to use only insecure key:
```ruby
config.ssh.insert_key = false
config.ssh.private_key_path = ["~/.vagrant.d/insecure_private_key"]
```

### Issue 4: Root SSH Login Denied
**Problem**: Root SSH was disabled by default on Rocky Linux.
**Fix**: Added to Vagrant provisioning script:
```bash
sed -i 's/#PermitRootLogin yes/PermitRootLogin yes/' /etc/ssh/sshd_config
echo "root:vagrant" | chpasswd
systemctl restart sshd
```

### Issue 5: SSH Test Endpoint - 405 Method Not Allowed
**Problem**: The `/api/v1/clusters/test-ssh` POST endpoint did not exist.
**Fix**: Added `test_ssh_connection` endpoint in `backend/app/api/v1/endpoints/clusters.py` using `paramiko` for SSH testing. Also added `SSHTestRequest` Pydantic model.

### Issue 6: ClusterResponse Validation Error
**Problem**: `id` field was `str` but database returns `UUID`; `kubernetes_version` could be `None`.
**Fix**: Changed `ClusterResponse` model:
```python
class ClusterResponse(BaseModel):
    id: UUID          # was: str
    kubernetes_version: str | None  # was: str
    class Config:
        from_attributes = True
        json_encoders = {UUID: str}
```

### Issue 7: Celery Worker Cannot Connect to Redis
**Problem**: Celery worker used `redis://localhost:6379/0` (default) instead of Docker service name `redis`.
**Root Cause**: `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND` environment variables were missing from `docker-compose.yml` for the backend, celery-worker, celery-beat, and flower services.
**Fix**: Added to ALL services in docker-compose.yml:
```yaml
- CELERY_BROKER_URL=redis://redis:6379/0
- CELERY_RESULT_BACKEND=redis://redis:6379/0
```

### Issue 8: Flower Container Failing to Start
**Problem**: Flower container crashed on startup due to missing environment variables.
**Fix**: Added `DATABASE_URL`, `SECRET_KEY`, `ENCRYPTION_KEY` to the flower service in docker-compose.yml.

### Issue 9: Backend Cannot Queue Celery Tasks
**Problem**: Backend service was missing `CELERY_BROKER_URL` environment variable, so it defaulted to `redis://localhost:6379/0` which doesn't exist inside the Docker network.
**Fix**: Added `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND` to the backend service environment.

### Issue 10: Missing Ansible Playbooks
**Problem**: Only `system_hardening.yml` existed. All other 8 playbooks were missing, causing provisioning to fail at the first phase.
**Fix**: Created all 8 missing playbooks:
- `preflight_check.yml` - System requirements validation
- `install_containerd.yml` - Container runtime installation
- `install_kubernetes.yml` - kubeadm, kubelet, kubectl installation
- `init_control_plane.yml` - kubeadm init on control plane
- `join_workers.yml` - Worker node cluster join
- `install_cni_calico.yml` - Calico CNI deployment
- `install_ingress_nginx.yml` - NGINX Ingress Controller
- `final_validation.yml` - Cluster health verification

### Issue 11: system_hardening.yml Used Non-Existent Role
**Problem**: The existing `system_hardening.yml` referenced `role: system_hardening` which didn't exist.
**Fix**: Rewrote the playbook with inline tasks (dnf updates, security packages, SELinux config, SSH hardening, audit, system limits).

### Issue 12: containerd CRI Error During kubeadm init
**Problem**: `kubeadm init` failed with `[ERROR CRI]: container runtime is not running` because containerd config was not generated/configured properly.
**Fix**: Updated `install_containerd.yml` to:
1. Always regenerate config: `containerd config default > /etc/containerd/config.toml`
2. Set `SystemdCgroup = true` using `replace` module
3. Stop and restart containerd
4. Wait for socket and verify with `crictl info`

### Issue 13: Provisioning Code Did Not Support Password Authentication
**Problem**: `_create_ansible_inventory()` only added SSH key path, not `ansible_ssh_pass` for password-based auth.
**Fix**: Updated `provision.py`:
1. Decrypt password from `ssh_cred.password_encrypted`
2. Pass password to inventory function
3. Add `ansible_ssh_pass=<password>` to inventory lines
4. Add `[all:vars]` section with `ansible_ssh_common_args='-o StrictHostKeyChecking=no'`
5. Set `ANSIBLE_HOST_KEY_CHECKING=False` environment variable when running playbooks

---

## 7. Ansible Playbooks

All playbooks are located in `k8s-provisioner/ansible/playbooks/`.

### Provisioning Phases (executed in order)

| # | Phase | Playbook | Hosts | Description |
|---|-------|----------|-------|-------------|
| 1 | Preflight Checks | `preflight_check.yml` | k8s_cluster | Validates RAM (>=2GB), CPU (>=2), OS (RedHat), disables swap, loads kernel modules, sets sysctl params |
| 2 | System Hardening | `system_hardening.yml` | k8s_cluster | Updates packages, installs security tools, configures SELinux (permissive), SSH hardening, auditd |
| 3 | Install Container Runtime | `install_containerd.yml` | k8s_cluster | Adds Docker repo, installs containerd.io, generates config with SystemdCgroup=true, verifies with crictl |
| 4 | Install Kubernetes | `install_kubernetes.yml` | k8s_cluster | Adds K8s repo (pkgs.k8s.io), installs kubelet/kubeadm/kubectl v1.28.3, configures crictl |
| 5 | Initialize Control Plane | `init_control_plane.yml` | control_plane | Runs `kubeadm init` with pod CIDR 10.244.0.0/16, sets up kubeconfig, generates join command |
| 6 | Join Workers | `join_workers.yml` | workers | Gets join command from control plane, joins workers, waits for Ready status |
| 7 | Install CNI | `install_cni_calico.yml` | control_plane | Downloads and applies Calico v3.26.4 manifest, waits for pods |
| 8 | Install Ingress | `install_ingress_nginx.yml` | control_plane | Applies NGINX Ingress Controller v1.9.4 baremetal manifest |
| 9 | Final Validation | `final_validation.yml` | control_plane | Verifies cluster-info, nodes, system pods, deploys/deletes test nginx pod |

### Ansible Inventory (auto-generated)

The provisioner dynamically generates an inventory file like:
```ini
[control_plane]
control-plane1 ansible_host=192.168.56.10 ansible_port=22 ansible_user=root ansible_ssh_pass=vagrant

[workers]
worker1 ansible_host=192.168.56.20 ansible_port=22 ansible_user=root ansible_ssh_pass=vagrant
worker2 ansible_host=192.168.56.21 ansible_port=22 ansible_user=root ansible_ssh_pass=vagrant

[k8s_cluster:children]
control_plane
workers

[all:vars]
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
```

---

## 8. Creating a Cluster

### Via Web UI

1. Open http://localhost:3001
2. Login with `admin@k8s-provisioner.local` / `AdminPassword123!`
3. Click **"Create Cluster"**
4. Fill the wizard:
   - **Step 1**: Cluster name, description
   - **Step 2**: Select topology (single-master)
   - **Step 3**: Add nodes:
     - `k8s-cp-1` / control-plane / 192.168.56.10 / port 22 / rocky9
     - `k8s-worker-1` / worker / 192.168.56.20 / port 22 / rocky9
     - `k8s-worker-2` / worker / 192.168.56.21 / port 22 / rocky9
   - **Step 4**: SSH config: username=`root`, auth=password, password=`vagrant`
   - **Step 5**: Select components (K8s 1.28.3, Calico, NGINX Ingress)
5. Click **"Test SSH"** to verify connectivity
6. Click **"Create Cluster"**

### Via API

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@k8s-provisioner.local&password=AdminPassword123!" \
  | jq -r '.access_token')

# Create cluster
curl -s -X POST http://localhost:8000/api/v1/clusters \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-cluster",
    "description": "LAB K8s cluster",
    "topology": {"type": "single-master"},
    "components": {
      "kubernetes_version": "1.28.3",
      "cni": "calico",
      "ingress": "nginx"
    },
    "nodes": [
      {"name": "control-plane1", "role": "control-plane", "ip_address": "192.168.56.10", "ssh_port": 22, "os_type": "rocky9"},
      {"name": "worker1", "role": "worker", "ip_address": "192.168.56.20", "ssh_port": 22, "os_type": "rocky9"},
      {"name": "worker2", "role": "worker", "ip_address": "192.168.56.21", "ssh_port": 22, "os_type": "rocky9"}
    ],
    "ssh_config": {
      "username": "root",
      "auth_method": "password",
      "password": "vagrant"
    },
    "provision_immediately": true
  }' | jq .
```

---

## 9. Monitoring & Dashboards

### Celery Flower Dashboard
- **URL**: http://localhost:5555
- Shows task status (PENDING, STARTED, SUCCESS, FAILURE)
- Click "Tasks" tab to see `provision_cluster` task progress

### Celery Worker Logs (real-time Ansible output)
```bash
cd k8s-provisioner
docker-compose logs -f celery-worker
```

### Job Logs in Database
```bash
# Get latest job status
docker exec k8s-prov-postgres psql -U k8s_provisioner -d k8s_provisioner \
  -c "SELECT id, status, current_phase, progress, error_message FROM jobs ORDER BY created_at DESC LIMIT 5;"

# Get detailed logs for a job
docker exec k8s-prov-postgres psql -U k8s_provisioner -d k8s_provisioner \
  -c "SELECT phase, level, message FROM job_logs WHERE job_id = '<JOB_ID>' ORDER BY timestamp;"
```

### Verify Cluster on VM
```bash
vagrant ssh k8s-cp-1
sudo kubectl get nodes -o wide
sudo kubectl -n kube-system get pods
sudo kubectl -n ingress-nginx get pods
```

---

## 10. API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login (form data: username, password) |
| POST | `/api/v1/auth/register` | Register new user |
| GET | `/api/v1/auth/me` | Get current user |

### Clusters
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/clusters` | List clusters (pagination, filter by status) |
| POST | `/api/v1/clusters` | Create cluster (triggers provisioning) |
| GET | `/api/v1/clusters/{id}` | Get cluster details |
| DELETE | `/api/v1/clusters/{id}` | Delete cluster (soft delete or deprovision) |
| GET | `/api/v1/clusters/{id}/kubeconfig` | Download kubeconfig |
| POST | `/api/v1/clusters/test-ssh` | Test SSH connectivity to nodes |

### Full API docs available at http://localhost:8000/docs (Swagger UI)

---

## 11. UI Flow

### Login Screen
- Email and password authentication
- JWT token stored in browser

### Dashboard
- Cluster count, status overview, recent activity
- Quick actions: Create Cluster

### Cluster Creation Wizard (5 steps)
1. **Cluster Info** - Name, description, template selection
2. **Topology** - Single-master or HA (multi-master)
3. **Nodes** - Add control-plane and worker nodes with IP/port/OS
4. **SSH Configuration** - Username, auth method (password or private key)
5. **Components & Review** - K8s version, CNI, Ingress, Security Hardening options

### Provisioning Progress
- Phase-by-phase progress bar
- Real-time log streaming
- Status indicators per node

---

## 12. Environment Variables

### Critical Environment Variables for Docker Services

All services that interact with Redis or Celery **must** have these variables set in `docker-compose.yml`:

```yaml
# Required for ALL services (backend, celery-worker, celery-beat, flower)
- DATABASE_URL=postgresql+asyncpg://k8s_provisioner:SecurePassword123!@postgres:5432/k8s_provisioner
- REDIS_URL=redis://redis:6379/0
- CELERY_BROKER_URL=redis://redis:6379/0
- CELERY_RESULT_BACKEND=redis://redis:6379/0
- SECRET_KEY=<your-secret-key>
- ENCRYPTION_KEY=<your-fernet-key>
```

### Common Mistake: Using `localhost` Instead of Docker Service Names

Inside Docker containers, services communicate via Docker network using **service names**, not `localhost`:

| Wrong (causes connection refused) | Correct |
|-----|---------|
| `redis://localhost:6379` | `redis://redis:6379` |
| `postgresql://localhost:5432` | `postgresql://postgres:5432` |

### Application Configuration (`backend/app/core/config.py`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | (required) | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis URL |
| `CELERY_BROKER_URL` | `redis://localhost:6379/0` | Celery broker |
| `CELERY_RESULT_BACKEND` | `redis://localhost:6379/0` | Celery results |
| `SECRET_KEY` | (required) | JWT signing key |
| `ENCRYPTION_KEY` | (required) | Fernet key for SSH credential encryption |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | JWT token expiry |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | CORS allowed origins |
| `ADMIN_EMAIL` | `admin@k8s-provisioner.local` | Default admin |
| `ADMIN_PASSWORD` | `AdminPassword123!` | Default admin password |
| `ANSIBLE_PLAYBOOKS_PATH` | `../ansible/playbooks` | Playbook directory |
| `DEFAULT_K8S_VERSION` | `1.28.3` | Default Kubernetes version |
| `DEFAULT_CNI` | `calico` | Default CNI plugin |
| `DEFAULT_INGRESS` | `nginx` | Default ingress controller |

---

## 13. Troubleshooting

### VM Issues

**VMs not reachable (ping fails)**
```bash
# Check VMs are running
vagrant status
# Restart specific VM
vagrant reload k8s-cp-1
```

**SSH connection refused**
```bash
# Verify SSH is enabled
vagrant ssh k8s-cp-1 -c "sudo systemctl status sshd"
# Fix SSH config
vagrant ssh k8s-cp-1 -c "sudo sed -i 's/#PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config && sudo systemctl restart sshd"
```

### Docker Service Issues

**Check service status**
```bash
cd k8s-provisioner
docker-compose ps
docker-compose logs <service-name> --tail=50
```

**Restart specific service**
```bash
docker-compose restart backend
docker-compose up -d --force-recreate celery-worker
```

**Reset everything**
```bash
docker-compose down -v  # WARNING: deletes all data
docker-compose up -d
```

### Provisioning Failures

**Check which phase failed**
```bash
docker exec k8s-prov-postgres psql -U k8s_provisioner -d k8s_provisioner \
  -c "SELECT status, current_phase, error_message FROM jobs ORDER BY created_at DESC LIMIT 1;"
```

**View detailed phase logs**
```bash
docker exec k8s-prov-postgres psql -U k8s_provisioner -d k8s_provisioner \
  -c "SELECT phase, message FROM job_logs WHERE job_id = '<JOB_ID>' AND phase = '<PHASE_NAME>' ORDER BY timestamp;"
```

**Reset VMs for re-provisioning**
```bash
# Reset kubeadm on all nodes
for vm in k8s-cp-1 k8s-worker-1 k8s-worker-2; do
  vagrant ssh $vm -c "sudo kubeadm reset -f; sudo rm -rf /etc/cni/net.d /var/lib/etcd /var/lib/kubelet/*"
done

# Fix containerd if needed
for vm in k8s-cp-1 k8s-worker-1 k8s-worker-2; do
  vagrant ssh $vm -c "sudo bash -c 'containerd config default > /etc/containerd/config.toml && sed -i \"s/SystemdCgroup = false/SystemdCgroup = true/\" /etc/containerd/config.toml && systemctl restart containerd'"
done
```

**containerd CRI error**
If `kubeadm init` fails with `[ERROR CRI]`, regenerate containerd config:
```bash
vagrant ssh k8s-cp-1 -c "sudo bash -c 'containerd config default > /etc/containerd/config.toml && sed -i \"s/SystemdCgroup = false/SystemdCgroup = true/\" /etc/containerd/config.toml && systemctl restart containerd'"
```

---

## 14. Project File Structure

```
LIVE_K8S/
|-- Vagrantfile                          # Vagrant VM definitions (Rocky Linux 9)
|-- K8S_PROVISIONER_COMPLETE_GUIDE.md    # This document
|-- 1. Install K8s.docx                  # Course materials
|-- 2. Preflight check.docx
|-- 3. K8s environment setup.docx
|-- 4. KeepAlived.docx
|-- 5. K8s dashboard.docx
|-- 6. Calico CNI.docx
|-- 7. Gateway API Installation.docx
|-- k8s-provisioner/                     # Main project
    |-- docker-compose.yml               # All 7 Docker services
    |-- .env                             # Environment variables
    |-- .env.example                     # Template
    |-- .gitignore
    |-- backend/                         # FastAPI application
    |   |-- Dockerfile
    |   |-- requirements.txt
    |   |-- app/
    |       |-- main.py                  # FastAPI app entry point
    |       |-- core/
    |       |   |-- config.py            # Settings (Pydantic)
    |       |   |-- security.py          # JWT + Fernet encryption
    |       |-- api/v1/endpoints/
    |       |   |-- auth.py              # Login, register, JWT
    |       |   |-- clusters.py          # CRUD + SSH test
    |       |-- models/
    |       |   |-- models.py            # SQLAlchemy models
    |       |-- db/
    |       |   |-- base.py              # Database session
    |       |-- tasks/
    |           |-- __init__.py
    |           |-- worker.py            # Celery configuration
    |           |-- provision.py         # Provisioning logic
    |-- ansible/
    |   |-- playbooks/
    |       |-- preflight_check.yml
    |       |-- system_hardening.yml
    |       |-- install_containerd.yml
    |       |-- install_kubernetes.yml
    |       |-- init_control_plane.yml
    |       |-- join_workers.yml
    |       |-- install_cni_calico.yml
    |       |-- install_ingress_nginx.yml
    |       |-- final_validation.yml
    |-- frontend/                        # React application
    |   |-- Dockerfile.dev
    |   |-- src/
    |-- docs/                            # Additional documentation
    |-- database/                        # DB migrations
    |-- deployment/                      # Deployment configs
```

---

## 15. Portability & Deployment on Any Server

### Overview

The K8s Provisioner platform is **fully portable** — you can copy the `k8s-provisioner/` directory to any Linux server and run it with Docker Compose. No dependencies on the original development machine.

### Prerequisites on the Target Server

1. **Docker** and **Docker Compose** installed
2. **Firewall disabled** (or ports 3001, 8000, 5555 opened)
3. **SELinux disabled** (or set to permissive)
4. **Network access** to target VMs/servers you want to provision

### Deploy to a New Server

```bash
# 1. Copy the project to the new server
scp -r k8s-provisioner/ user@new-server:/opt/k8s-provisioner/

# 2. SSH to the server
ssh user@new-server

# 3. Update frontend env vars if server has a specific IP/hostname
#    Edit docker-compose.yml → frontend environment:
#    - VITE_API_URL=http://<SERVER_IP>:8000
#    - VITE_WS_URL=ws://<SERVER_IP>:8000

# 4. Update CORS if accessing from a different origin
#    Edit docker-compose.yml → backend environment:
#    - ALLOWED_ORIGINS=http://<SERVER_IP>:3001

# 5. Start the platform
cd /opt/k8s-provisioner
docker-compose up -d

# 6. Verify all services are running
docker-compose ps
```

### What to Change When Moving to a New Server

| File | Variable | What to Change |
|------|----------|----------------|
| `docker-compose.yml` | `VITE_API_URL` (frontend) | Replace `localhost` with server IP/hostname |
| `docker-compose.yml` | `VITE_WS_URL` (frontend) | Replace `localhost` with server IP/hostname |
| `docker-compose.yml` | `ALLOWED_ORIGINS` (backend) | Add the URL users will access the UI from |
| `docker-compose.yml` | `SECRET_KEY` (backend) | Generate a new key for production: `openssl rand -hex 32` |
| `docker-compose.yml` | `ENCRYPTION_KEY` (backend) | Generate new: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |

### What You Do NOT Need to Change

- **Database URL**: Uses Docker service name `postgres` (internal networking)
- **Redis URL**: Uses Docker service name `redis` (internal networking)
- **Celery Broker/Result Backend**: Uses `redis` service name
- **Ansible Playbooks**: Bundled inside the container via volume mount
- **Frontend API calls**: All use the `VITE_API_URL` env variable (no hardcoded URLs)

### Portability Fixes Applied

The following fixes were applied to ensure full portability:

1. **Login.tsx** — Removed hardcoded `http://localhost:8000` API calls; now uses centralized `authAPI` from `api.ts` service which reads `VITE_API_URL`
2. **Dashboard.tsx** — Replaced hardcoded `http://localhost:8000/docs` link with dynamic `${API_URL}/docs` using `VITE_API_URL`
3. **docker-compose.yml** — Changed frontend env vars from `REACT_APP_API_URL` to `VITE_API_URL` (Vite requires `VITE_` prefix, not `REACT_APP_`)
4. **.env / .env.example** — Updated variable names from `REACT_APP_*` to `VITE_*` and added Docker vs localhost documentation

### How the Frontend Resolves API URL

```
VITE_API_URL env var (docker-compose.yml)
    ↓
import.meta.env.VITE_API_URL  (Vite injects at build/serve time)
    ↓
Falls back to 'http://localhost:8000' if not set
    ↓
Used by api.ts for all API calls
```

### Production Deployment Checklist

- [ ] Change `SECRET_KEY` to a randomly generated value
- [ ] Change `ENCRYPTION_KEY` to a new Fernet key
- [ ] Change `ADMIN_PASSWORD` from default
- [ ] Change `POSTGRES_PASSWORD` from default
- [ ] Set `VITE_API_URL` and `VITE_WS_URL` to the server's actual IP/hostname
- [ ] Update `ALLOWED_ORIGINS` for CORS
- [ ] Set `ENVIRONMENT=production`
- [ ] Consider enabling TLS/HTTPS with a reverse proxy (nginx, traefik)
- [ ] Ensure target nodes are reachable from the Docker host network

---

## Quick Reference

### Start Everything
```bash
# Start VMs
cd LIVE_K8S && vagrant up

# Start platform
cd k8s-provisioner && docker-compose up -d

# Access
open http://localhost:3001      # Web UI
open http://localhost:5555      # Flower
open http://localhost:8000/docs # API Docs
```

### Stop Everything
```bash
# Stop platform
cd k8s-provisioner && docker-compose down

# Stop VMs (preserve state)
cd LIVE_K8S && vagrant halt

# Destroy VMs (delete)
cd LIVE_K8S && vagrant destroy -f
```
