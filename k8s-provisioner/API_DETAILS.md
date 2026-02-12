# K8S Provisioner - API Reference

> **Base URL**: `/api/v1`
> **Framework**: FastAPI
> **Swagger UI**: `http://localhost:8000/docs`
> **ReDoc**: `http://localhost:8000/redoc`

---

## Table of Contents

- [Frontend Pages](#frontend-pages)
- [Default Credentials](#default-credentials)
- [Authentication](#authentication)
- [Root Endpoints](#root-endpoints)
- [Auth Endpoints](#auth-endpoints)
- [Cluster Management Endpoints](#cluster-management-endpoints)
- [Node Management Endpoints](#node-management-endpoints-planned)
- [Job Management Endpoints](#job-management-endpoints-planned)
- [Template Endpoints](#template-endpoints-planned)
- [User Management Endpoints](#user-management-endpoints-planned)
- [Audit Log Endpoints](#audit-log-endpoints-planned)

---

## Frontend Pages

> **Frontend URL**: `http://localhost:3001`

### Default Credentials

| Field    | Value                          |
|----------|--------------------------------|
| Email    | `admin@k8s-provisioner.local`  |
| Password | `AdminPassword123!`            |

### Pages & Navigation

| Action             | URL                                                        | Description                                         |
|--------------------|------------------------------------------------------------|-----------------------------------------------------|
| **Login**          | [http://localhost:3001/login](http://localhost:3001/login)  | Authenticate with email & password                  |
| **Dashboard**      | [http://localhost:3001/dashboard](http://localhost:3001/dashboard) | Overview of clusters, jobs & system stats      |
| **List Clusters**  | [http://localhost:3001/clusters](http://localhost:3001/clusters) | View all clusters with status & filters          |
| **Create Cluster** | [http://localhost:3001/clusters/new](http://localhost:3001/clusters/new) | Multi-step wizard to provision a new K8s cluster |
| **Cluster Details**| http://localhost:3001/clusters/:id                         | View specific cluster info, nodes & kubeconfig      |
| **List Jobs**      | [http://localhost:3001/jobs](http://localhost:3001/jobs)    | View all provisioning/scaling/upgrade jobs           |
| **Job Details**    | http://localhost:3001/jobs/:id                             | View specific job progress, phases & logs            |
| **Templates**      | [http://localhost:3001/templates](http://localhost:3001/templates) | View reusable cluster configuration templates  |

### Quick Start Flow

1. **Login** → http://localhost:3001/login
2. **Dashboard** → http://localhost:3001/dashboard *(auto-redirect after login)*
3. **Create Cluster** → http://localhost:3001/clusters/new
4. **Monitor Job** → http://localhost:3001/jobs/:id *(redirected after cluster creation)*
5. **View Cluster** → http://localhost:3001/clusters/:id *(once provisioned)*
- [Data Models](#data-models)
- [Configuration](#configuration)

---

## Authentication

| Property            | Value                                |
| ------------------- | ------------------------------------ |
| **Type**            | JWT Bearer Token (OAuth2)            |
| **Access Token**    | 30 minutes expiration                |
| **Refresh Token**   | 7 days expiration                    |
| **Algorithm**       | HS256                                |
| **Header**          | `Authorization: Bearer <token>`      |

### Authorization Roles

| Role       | Permissions                                        |
| ---------- | -------------------------------------------------- |
| `admin`    | Full access, delete any cluster, manage users      |
| `operator` | Create/manage clusters, view audit logs            |
| `viewer`   | Read-only access to clusters                       |

---

## Root Endpoints

### 1. `GET /` — API Info

**Auth**: None

**Response** `200`:
```json
{
  "message": "Kubernetes Provisioner Platform API",
  "version": "1.0.0",
  "docs": "/docs",
  "api": "/api/v1"
}
```

---

### 2. `GET /health` — Health Check

**Auth**: None

**Response** `200`:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

---

## Auth Endpoints

### 1. `POST /api/v1/auth/login` — User Login

**Auth**: None (public)

**Request Body** (`OAuth2PasswordRequestForm`):
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response** `200`:
```json
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "refresh_token": "eyJhbGciOiJIUzI1...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "admin",
    "full_name": "John Doe"
  }
}
```

**Errors**:
| Code | Description               |
| ---- | ------------------------- |
| 401  | Incorrect email/password  |
| 403  | Inactive user             |

---

### 2. `POST /api/v1/auth/refresh` — Refresh Token

**Auth**: None (public)

**Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1..."
}
```

**Response** `200`:
```json
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "refresh_token": "eyJhbGciOiJIUzI1...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "role": "admin",
    "full_name": "John Doe"
  }
}
```

**Errors**:
| Code | Description                                    |
| ---- | ---------------------------------------------- |
| 401  | Invalid credentials / User not found/inactive  |

---

### 3. `POST /api/v1/auth/logout` — Logout

**Auth**: Required (Bearer token)

**Response** `204`: No content

---

### 4. `GET /api/v1/auth/me` — Current User Info

**Auth**: Required (Bearer token)

**Response** `200`:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "admin"
}
```

---

## Cluster Management Endpoints

### 1. `POST /api/v1/clusters` — Create Cluster

**Auth**: Required (Bearer token)

**Request Body**:
```json
{
  "name": "my-cluster",
  "description": "My production Kubernetes cluster",
  "template_id": null,
  "topology": {
    "ha": true,
    "control_plane_count": 3,
    "worker_count": 5
  },
  "components": {
    "kubernetes_version": "1.28.3",
    "cni": "calico",
    "ingress": "nginx",
    "runtime": "containerd"
  },
  "nodes": [
    {
      "name": "control-01",
      "role": "control-plane",
      "ip_address": "192.168.1.10",
      "ssh_port": 22,
      "os_type": "rocky9"
    },
    {
      "name": "control-02",
      "role": "control-plane",
      "ip_address": "192.168.1.11",
      "ssh_port": 22,
      "os_type": "rocky9"
    },
    {
      "name": "worker-01",
      "role": "worker",
      "ip_address": "192.168.1.20",
      "ssh_port": 22,
      "os_type": "rocky9"
    }
  ],
  "ssh_config": {
    "username": "root",
    "auth_method": "private_key",
    "private_key": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----",
    "passphrase": "optional_key_passphrase",
    "password": null
  },
  "hardening": {
    "enable_cis_k8s_benchmark": true,
    "enable_cis_linux_benchmark": true
  },
  "provision_immediately": true
}
```

**Field Details**:

| Field                    | Type     | Required | Description                                              |
| ------------------------ | -------- | -------- | -------------------------------------------------------- |
| `name`                   | string   | Yes      | Unique cluster name                                      |
| `description`            | string   | No       | Cluster description                                      |
| `template_id`            | UUID     | No       | Use a pre-defined template                               |
| `topology.ha`            | boolean  | Yes      | Enable high availability                                 |
| `topology.control_plane_count` | int | Yes    | Number of control plane nodes                            |
| `topology.worker_count`  | int      | Yes      | Number of worker nodes                                   |
| `components.kubernetes_version` | string | Yes | K8s version (e.g., `1.28.3`)                           |
| `components.cni`         | string   | Yes      | CNI plugin: `calico`, `cilium`, `flannel`                |
| `components.ingress`     | string   | Yes      | Ingress controller: `nginx`, `traefik`, `haproxy`        |
| `components.runtime`     | string   | Yes      | Container runtime: `containerd`                          |
| `nodes[].name`           | string   | Yes      | Node hostname                                            |
| `nodes[].role`           | string   | Yes      | `control-plane` or `worker`                              |
| `nodes[].ip_address`     | string   | Yes      | Node IP address                                          |
| `nodes[].ssh_port`       | int      | No       | SSH port (default: `22`)                                 |
| `nodes[].os_type`        | string   | Yes      | OS type: `rocky9`, `ubuntu22`, `rhel9`                   |
| `ssh_config.username`    | string   | Yes      | SSH username                                             |
| `ssh_config.auth_method` | string   | Yes      | `password` or `private_key`                              |
| `ssh_config.private_key` | string   | Cond.    | Required if auth_method is `private_key`                 |
| `ssh_config.passphrase`  | string   | No       | Passphrase for encrypted private key                     |
| `ssh_config.password`    | string   | Cond.    | Required if auth_method is `password`                    |
| `hardening.enable_cis_k8s_benchmark` | bool | No | Enable CIS Kubernetes benchmark hardening             |
| `hardening.enable_cis_linux_benchmark` | bool | No | Enable CIS Linux benchmark hardening                 |
| `provision_immediately`  | boolean  | No       | Start provisioning immediately (default: `true`)         |

**Response** `201`:
```json
{
  "cluster": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "my-cluster",
    "status": "pending",
    "created_at": "2025-01-29T10:00:00Z"
  },
  "job": {
    "id": "f1e2d3c4-b5a6-7890-dcba-fe0987654321",
    "type": "provision",
    "status": "queued",
    "created_at": "2025-01-29T10:00:00Z"
  }
}
```

**Side Effects**:
- Creates cluster record in database
- Creates node records for each node
- Encrypts and stores SSH credentials (Fernet encryption)
- Queues a Celery provisioning task if `provision_immediately=true`

**Errors**:
| Code | Description                    |
| ---- | ------------------------------ |
| 401  | Unauthorized                   |
| 409  | Cluster name already exists    |

---

### 2. `GET /api/v1/clusters` — List Clusters

**Auth**: Required (Bearer token)

**Query Parameters**:

| Param          | Type   | Default | Description                                                          |
| -------------- | ------ | ------- | -------------------------------------------------------------------- |
| `page`         | int    | 1       | Page number                                                          |
| `page_size`    | int    | 20      | Items per page                                                       |
| `status_filter`| string | —       | Filter by: `pending`, `provisioning`, `running`, `failed`, `deleted`, `all` |

**Response** `200`:
```json
{
  "total": 5,
  "page": 1,
  "page_size": 20,
  "total_pages": 1,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "production-cluster",
      "description": "Production Kubernetes cluster",
      "status": "running",
      "kubernetes_version": "1.28.3",
      "topology": {
        "ha": true,
        "control_plane_count": 3,
        "worker_count": 5
      },
      "components": {
        "cni": "calico",
        "ingress": "nginx",
        "runtime": "containerd",
        "kubernetes_version": "1.28.3"
      },
      "created_at": "2025-01-29T10:00:00",
      "updated_at": "2025-01-29T12:00:00"
    }
  ]
}
```

---

### 3. `GET /api/v1/clusters/{cluster_id}` — Get Cluster Details

**Auth**: Required (Bearer token)

**Path Parameters**:

| Param        | Type | Description         |
| ------------ | ---- | ------------------- |
| `cluster_id` | UUID | Cluster identifier  |

**Response** `200`:
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "production-cluster",
  "description": "Production Kubernetes cluster",
  "status": "running",
  "kubernetes_version": "1.28.3",
  "topology": {
    "ha": true,
    "control_plane_count": 3,
    "worker_count": 5
  },
  "components": {
    "cni": "calico",
    "ingress": "nginx",
    "runtime": "containerd",
    "kubernetes_version": "1.28.3"
  },
  "created_at": "2025-01-29T10:00:00",
  "updated_at": "2025-01-29T12:00:00"
}
```

**Errors**:
| Code | Description        |
| ---- | ------------------ |
| 401  | Unauthorized       |
| 404  | Cluster not found  |

---

### 4. `DELETE /api/v1/clusters/{cluster_id}` — Delete Cluster

**Auth**: Required (Bearer token)
**Authorization**: Cluster creator or admin role only

**Path Parameters**:

| Param        | Type | Description         |
| ------------ | ---- | ------------------- |
| `cluster_id` | UUID | Cluster identifier  |

**Query Parameters**:

| Param         | Type    | Default | Description                                       |
| ------------- | ------- | ------- | ------------------------------------------------- |
| `deprovision` | boolean | false   | If true, creates a deprovision job on the nodes   |

**Response** `202` (with deprovision):
```json
{
  "message": "Cluster deletion initiated",
  "cluster_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "job_id": "f1e2d3c4-b5a6-7890-dcba-fe0987654321"
}
```

**Response** `202` (soft delete):
```json
{
  "message": "Cluster marked as deleted",
  "cluster_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Errors**:
| Code | Description              |
| ---- | ------------------------ |
| 401  | Unauthorized             |
| 403  | Not enough permissions   |
| 404  | Cluster not found        |

---

### 5. `POST /api/v1/clusters/test-ssh` — Test SSH Connection

**Auth**: Required (Bearer token)

**Request Body**:
```json
{
  "nodes": [
    {
      "name": "node-01",
      "role": "control-plane",
      "ip_address": "192.168.1.10",
      "ssh_port": 22,
      "os_type": "rocky9"
    }
  ],
  "ssh_config": {
    "username": "root",
    "auth_method": "password",
    "password": "ssh_password"
  }
}
```

**Response** `200`:
```json
{
  "success": true,
  "results": [
    {
      "node": "node-01",
      "ip_address": "192.168.1.10",
      "success": true,
      "message": "Connected successfully. Hostname: node-01"
    }
  ]
}
```

---

### 6. `GET /api/v1/clusters/{cluster_id}/kubeconfig` — Download Kubeconfig

**Auth**: Required (Bearer token)

**Path Parameters**:

| Param        | Type | Description         |
| ------------ | ---- | ------------------- |
| `cluster_id` | UUID | Cluster identifier  |

**Response** `200`:
- **Content-Type**: `application/x-yaml`
- **Content-Disposition**: `attachment; filename="<cluster-name>-kubeconfig.yaml"`
- **Body**: YAML kubeconfig file

**Errors**:
| Code | Description                              |
| ---- | ---------------------------------------- |
| 401  | Unauthorized                             |
| 404  | Cluster not found or kubeconfig not ready |

---

## Node Management Endpoints (Planned)

> Status: **Not yet implemented**

| Method   | Endpoint                                          | Description                  |
| -------- | ------------------------------------------------- | ---------------------------- |
| `GET`    | `/api/v1/clusters/{cluster_id}/nodes`             | List nodes in a cluster      |
| `POST`   | `/api/v1/clusters/{cluster_id}/nodes/{node_id}/drain` | Drain node for maintenance |
| `DELETE` | `/api/v1/clusters/{cluster_id}/nodes/{node_id}`   | Remove node from cluster     |

---

## Job Management Endpoints (Planned)

> Status: **Not yet implemented**

| Method | Endpoint          | Description       |
| ------ | ----------------- | ----------------- |
| `GET`  | `/api/v1/jobs`    | List jobs         |
| `GET`  | `/api/v1/jobs/{id}` | Get job details |

---

## Template Endpoints (Planned)

> Status: **Not yet implemented**

| Method   | Endpoint                | Description         |
| -------- | ----------------------- | ------------------- |
| `GET`    | `/api/v1/templates`     | List templates      |
| `POST`   | `/api/v1/templates`     | Create template     |
| `GET`    | `/api/v1/templates/{id}` | Get template       |
| `DELETE` | `/api/v1/templates/{id}` | Delete template    |

---

## User Management Endpoints (Planned)

> Status: **Not yet implemented**

| Method   | Endpoint             | Description     |
| -------- | -------------------- | --------------- |
| `GET`    | `/api/v1/users`      | List users      |
| `POST`   | `/api/v1/users`      | Create user     |
| `PUT`    | `/api/v1/users/{id}` | Update user     |
| `DELETE` | `/api/v1/users/{id}` | Delete user     |

---

## Audit Log Endpoints (Planned)

> Status: **Not yet implemented**

| Method | Endpoint              | Description      |
| ------ | --------------------- | ---------------- |
| `GET`  | `/api/v1/audit-logs`  | List audit logs  |

---

## Data Models

### Cluster Statuses

| Status         | Description                            |
| -------------- | -------------------------------------- |
| `pending`      | Cluster created, not yet provisioning  |
| `provisioning` | Provisioning in progress               |
| `running`      | Cluster is up and healthy              |
| `failed`       | Provisioning or operation failed       |
| `deleted`      | Cluster has been deleted               |

### Node Roles

| Role             | Description                    |
| ---------------- | ------------------------------ |
| `control-plane`  | Kubernetes control plane node  |
| `worker`         | Kubernetes worker node         |

### Supported OS Types

| OS Type   | Description          |
| --------- | -------------------- |
| `rocky9`  | Rocky Linux 9        |
| `ubuntu22`| Ubuntu 22.04 LTS     |
| `rhel9`   | Red Hat Enterprise 9 |

### Job Types

| Type          | Description                          |
| ------------- | ------------------------------------ |
| `provision`   | Initial cluster provisioning         |
| `scale`       | Scale cluster (add/remove nodes)     |
| `upgrade`     | Upgrade Kubernetes version           |
| `deprovision` | Tear down and clean up cluster       |

### Job Statuses

| Status      | Description                |
| ----------- | -------------------------- |
| `queued`    | Waiting to be processed    |
| `running`   | Currently executing        |
| `success`   | Completed successfully     |
| `failed`    | Failed with errors         |
| `cancelled` | Cancelled by user          |

---

## Configuration

### Environment Variables

| Variable                      | Default               | Description                           |
| ----------------------------- | --------------------- | ------------------------------------- |
| `DATABASE_URL`                | —                     | PostgreSQL connection string          |
| `REDIS_URL`                   | `redis://localhost:6379/0` | Redis connection URL             |
| `SECRET_KEY`                  | —                     | JWT signing secret                    |
| `ENCRYPTION_KEY`              | —                     | Fernet key for SSH credential encryption |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30`                  | Access token TTL                      |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | `7`                   | Refresh token TTL                     |
| `ALLOWED_ORIGINS`             | `*`                   | CORS allowed origins (comma-separated)|
| `DEFAULT_K8S_VERSION`         | `1.28.3`              | Default Kubernetes version            |
| `DEFAULT_CNI`                 | `calico`              | Default CNI plugin                    |
| `DEFAULT_INGRESS`             | `nginx`               | Default ingress controller            |
| `DEFAULT_CONTAINER_RUNTIME`   | `containerd`          | Default container runtime             |
| `RATE_LIMIT_PER_MINUTE`       | `100`                 | API rate limit per minute             |
| `RATE_LIMIT_PER_HOUR`         | `1000`                | API rate limit per hour               |

---

## Endpoint Summary

| #  | Method   | Endpoint                                    | Auth     | Status      |
| -- | -------- | ------------------------------------------- | -------- | ----------- |
| 1  | `GET`    | `/`                                         | No       | Implemented |
| 2  | `GET`    | `/health`                                   | No       | Implemented |
| 3  | `POST`   | `/api/v1/auth/login`                        | No       | Implemented |
| 4  | `POST`   | `/api/v1/auth/refresh`                      | No       | Implemented |
| 5  | `POST`   | `/api/v1/auth/logout`                       | Yes      | Implemented |
| 6  | `GET`    | `/api/v1/auth/me`                           | Yes      | Implemented |
| 7  | `POST`   | `/api/v1/clusters`                          | Yes      | Implemented |
| 8  | `GET`    | `/api/v1/clusters`                          | Yes      | Implemented |
| 9  | `GET`    | `/api/v1/clusters/{cluster_id}`             | Yes      | Implemented |
| 10 | `DELETE` | `/api/v1/clusters/{cluster_id}`             | Yes      | Implemented |
| 11 | `POST`   | `/api/v1/clusters/test-ssh`                 | Yes      | Implemented |
| 12 | `GET`    | `/api/v1/clusters/{cluster_id}/kubeconfig`  | Yes      | Implemented |
| 13 | `GET`    | `/api/v1/clusters/{cluster_id}/nodes`       | Yes      | Planned     |
| 14 | `POST`   | `/api/v1/clusters/{cluster_id}/nodes/{id}/drain` | Yes | Planned     |
| 15 | `DELETE` | `/api/v1/clusters/{cluster_id}/nodes/{id}`  | Yes      | Planned     |
| 16 | `GET`    | `/api/v1/jobs`                              | Yes      | Planned     |
| 17 | `GET`    | `/api/v1/jobs/{id}`                         | Yes      | Planned     |
| 18 | `GET`    | `/api/v1/templates`                         | Yes      | Planned     |
| 19 | `POST`   | `/api/v1/templates`                         | Yes      | Planned     |
| 20 | `GET`    | `/api/v1/users`                             | Yes      | Planned     |
| 21 | `POST`   | `/api/v1/users`                             | Yes      | Planned     |
| 22 | `GET`    | `/api/v1/audit-logs`                        | Yes      | Planned     |
