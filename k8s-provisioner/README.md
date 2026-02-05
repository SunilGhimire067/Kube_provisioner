# Kubernetes Provisioner Platform

A production-grade web-based platform for provisioning Kubernetes clusters on bare metal or VMs via SSH.

## Features

- 🚀 Web UI-driven cluster provisioning
- 🔐 SSH-based secure node access
- 🛡️ CIS Kubernetes & Linux Benchmark hardening
- 📊 Real-time provisioning progress tracking
- 🎯 HA and non-HA cluster support
- 🔧 Customizable components (CNI, Ingress, Runtime)
- 📝 Template-based cluster creation
- 🔍 Comprehensive audit logging

## Architecture

```
┌─────────────┐
│ React UI    │ (Frontend)
└──────┬──────┘
       │ HTTPS/WSS
┌──────▼──────┐
│ FastAPI     │ (Backend API)
└──────┬──────┘
       │
┌──────▼──────┐     ┌─────────────┐
│ PostgreSQL  │────▶│ Redis       │
└─────────────┘     └──────┬──────┘
                          │
                    ┌─────▼─────┐
                    │ Celery    │
                    │ Workers   │
                    └─────┬─────┘
                          │
                    ┌─────▼─────┐
                    │ Ansible   │
                    │ Engine    │
                    └─────┬─────┘
                          │ SSH
                    ┌─────▼─────┐
                    │ K8s Nodes │
                    └───────────┘
```

## Tech Stack

### Frontend
- **React 18+** with TypeScript
- **Material-UI (MUI)** for UI components
- **Redux Toolkit** for state management
- **React Hook Form** + **Zod** for form validation
- **Axios** for API calls
- **Socket.IO** for WebSocket

### Backend
- **FastAPI** (Python 3.11+)
- **SQLAlchemy 2.0** (async)
- **Alembic** for migrations
- **Pydantic v2** for validation
- **Celery** for async tasks
- **Redis** as message broker
- **PostgreSQL** database

### Provisioning
- **Ansible 2.15+**
- **Paramiko** for SSH
- Custom Python orchestration

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.11+
- Node.js 18+
- Ansible 2.15+

### Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd k8s-provisioner
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start services with Docker Compose**
```bash
docker-compose up -d
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Celery Flower: http://localhost:5555

### Manual Setup (without Docker)

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# In another terminal, start Celery worker
celery -A app.tasks.worker worker --loglevel=info

# In another terminal, start Celery beat (scheduler)
celery -A app.tasks.worker beat --loglevel=info
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

## Usage

### Creating a Cluster

1. Log in to the web UI
2. Click "New Cluster"
3. Follow the wizard:
   - Step 1: Define cluster name and topology
   - Step 2: Select Kubernetes version and components
   - Step 3: Configure nodes (IP, SSH details)
   - Step 4: Provide SSH credentials
   - Step 5: Review and start provisioning
4. Monitor progress in real-time
5. Download kubeconfig when complete

### Cluster Components

**Kubernetes Versions:**
- 1.28.x (Latest stable)
- 1.27.x
- 1.26.x

**CNI Plugins:**
- Calico (recommended for production)
- Cilium (advanced networking + eBPF)
- Flannel (simple overlay)

**Ingress Controllers:**
- NGINX (recommended)
- HAProxy
- Traefik

**Container Runtime:**
- containerd (default)

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/k8s_provisioner

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Encryption
ENCRYPTION_KEY=your-fernet-key-here

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Ansible
ANSIBLE_PLAYBOOKS_PATH=/path/to/ansible/playbooks
ANSIBLE_ROLES_PATH=/path/to/ansible/roles
```

### System Requirements

**Provisioner Server:**
- 4 CPU cores
- 8 GB RAM
- 50 GB disk
- Ubuntu 22.04 / Rocky Linux 9

**Target Nodes (per node):**
- 2+ CPU cores (4+ for control plane)
- 4+ GB RAM (8+ for control plane)
- 50+ GB disk
- Rocky Linux 9 / Ubuntu 22.04 / RHEL 9
- SSH access (key-based)
- Outbound internet access (for package downloads)

## Security

### Features

- 🔐 JWT-based authentication
- 🛡️ Role-based access control (RBAC)
- 🔒 SSH key encryption at rest
- 📝 Comprehensive audit logging
- 🔍 CIS benchmark compliance
- 🚪 SSH key-based authentication (no passwords)

### Hardening

The platform applies:
- CIS Kubernetes Benchmark
- CIS Linux Benchmark
- Kernel parameter tuning
- Firewall rules
- SSH hardening
- File permission controls

## API Documentation

Once the backend is running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
pytest tests/ --cov=app
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

### Ansible Tests
```bash
cd ansible
molecule test -s <role-name>
```

## Deployment

### Docker Deployment

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment

```bash
kubectl apply -f deployment/kubernetes/
```

## Monitoring

### Logs

```bash
# Backend logs
docker-compose logs -f backend

# Celery worker logs
docker-compose logs -f celery-worker

# Frontend logs
docker-compose logs -f frontend
```

### Metrics

Access Celery Flower dashboard:
```
http://localhost:5555
```

## Troubleshooting

### Common Issues

**SSH Connection Failed**
- Verify SSH key format (OpenSSH)
- Check node firewall rules
- Ensure SSH port is correct
- Verify node IP is reachable

**Provisioning Timeout**
- Check internet connectivity on target nodes
- Verify package repositories are accessible
- Review Ansible logs for specific errors

**Database Connection Error**
- Ensure PostgreSQL is running
- Verify DATABASE_URL in .env
- Check database credentials

## Project Structure

```
k8s-provisioner/
├── frontend/           # React TypeScript UI
│   ├── public/
│   └── src/
│       ├── components/ # Reusable components
│       ├── pages/      # Page components
│       ├── services/   # API clients
│       ├── store/      # Redux store
│       └── types/      # TypeScript types
├── backend/            # FastAPI backend
│   ├── app/
│   │   ├── api/        # API endpoints
│   │   ├── core/       # Config, security
│   │   ├── db/         # Database setup
│   │   ├── models/     # SQLAlchemy models
│   │   ├── schemas/    # Pydantic schemas
│   │   ├── services/   # Business logic
│   │   ├── tasks/      # Celery tasks
│   │   └── utils/      # Utilities
│   └── tests/          # Tests
├── ansible/            # Ansible provisioning
│   ├── roles/          # Ansible roles
│   ├── playbooks/      # Playbooks
│   └── inventory/      # Dynamic inventory
├── database/           # DB migrations
│   └── migrations/
├── deployment/         # Deployment configs
│   ├── docker/
│   └── kubernetes/
└── docs/               # Documentation
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check documentation in `/docs`
- Review API documentation

## Roadmap

### Phase 2
- [ ] Cluster lifecycle management (upgrades, scaling)
- [ ] Multi-cluster dashboard
- [ ] GitOps integration (Flux/ArgoCD)
- [ ] Backup and restore

### Phase 3
- [ ] Multi-cloud support (AWS, Azure, GCP)
- [ ] Terraform integration
- [ ] Cost tracking
- [ ] AI-powered capacity planning
- [ ] Self-healing capabilities

## Authors

Platform Development Team

## Acknowledgments

- Kubernetes community
- Ansible community
- FastAPI framework
- React community
