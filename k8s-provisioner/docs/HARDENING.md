# Security Hardening Documentation

## Overview

The K8s Provisioner Platform applies security hardening across two phases during cluster provisioning:

1. **Phase 2 — System Hardening** (`system_hardening.yml`) — OS-level hardening based on CIS Linux Benchmark
2. **Across All Phases** — Kubernetes-specific security from CIS Kubernetes Benchmark applied via preflight, containerd, kubeadm init, and CNI playbooks

This document maps every hardening task implemented in the playbooks to its corresponding CIS Benchmark control.

---

## CIS Linux Benchmark Controls Applied

Reference: **CIS Rocky Linux 9 Benchmark v1.0.0**

The `system_hardening.yml` and `preflight_check.yml` playbooks apply the following controls:

### 1. Software Updates (CIS 1.9)

| Control | CIS ID | Playbook | Task |
|---------|--------|----------|------|
| Ensure updates and patches are applied | 1.9 | `system_hardening.yml` | `Update all packages` |

**Implementation:**
```yaml
- name: Update all packages
  dnf:
    name: "*"
    state: latest
    update_cache: yes
```
Ensures all system packages are patched to the latest versions, reducing known vulnerability exposure.

---

### 2. Mandatory Access Control — SELinux (CIS 1.6.1.x)

| Control | CIS ID | Playbook | Task |
|---------|--------|----------|------|
| Ensure SELinux is installed | 1.6.1.1 | `system_hardening.yml` | `Install essential security packages` |
| Ensure SELinux policy is configured (targeted) | 1.6.1.3 | `system_hardening.yml` | `Ensure SELinux is in permissive mode` |
| Ensure SELinux mode is not disabled | 1.6.1.5 | `system_hardening.yml` | `Ensure SELinux is in permissive mode` |

**Implementation:**
```yaml
- name: Install essential security packages
  dnf:
    name:
      - policycoreutils
      - selinux-policy-targeted
    state: present

- name: Ensure SELinux is in permissive mode for K8s (LAB only)
  selinux:
    policy: targeted
    state: permissive
```

**Note:** SELinux is set to `permissive` (not `enforcing`) because Kubernetes container runtimes and CNI plugins require specific SELinux policy exceptions that are not included in the default targeted policy. In production, a custom SELinux policy module should be written for `enforcing` mode.

---

### 3. Auditing — auditd (CIS 4.1.1.x)

| Control | CIS ID | Playbook | Task |
|---------|--------|----------|------|
| Ensure auditd is installed | 4.1.1.1 | `system_hardening.yml` | `Install essential security packages` |
| Ensure auditd service is enabled and running | 4.1.1.2 | `system_hardening.yml` | `Ensure auditd is running` |

**Implementation:**
```yaml
- name: Install essential security packages
  dnf:
    name:
      - audit
    state: present

- name: Ensure auditd is running
  systemd:
    name: auditd
    state: started
    enabled: yes
```

Provides system-level audit logging for security event tracking. auditd records system calls, file access, authentication events, and privilege escalations.

---

### 4. SSH Server Configuration (CIS 5.2.x)

| Control | CIS ID | Playbook | Task |
|---------|--------|----------|------|
| Ensure permissions on SSH config are correct | 5.2.1 | `system_hardening.yml` | SSH config via `lineinfile` |
| Ensure SSH PermitEmptyPasswords is disabled | 5.2.11 | `system_hardening.yml` | `Configure SSH - disable empty passwords` |
| Ensure SSH root login is configured | 5.2.10 | `system_hardening.yml` | `Configure SSH - disable root password auth` |

**Implementation:**
```yaml
- name: Configure SSH - disable empty passwords
  lineinfile:
    path: /etc/ssh/sshd_config
    regexp: "^#?PermitEmptyPasswords"
    line: "PermitEmptyPasswords no"

- name: Configure SSH - disable root password auth (keep key auth)
  lineinfile:
    path: /etc/ssh/sshd_config
    regexp: "^#?PermitRootLogin"
    line: "PermitRootLogin yes"
```

**Note:** Root login is set to `yes` in the LAB environment for Ansible provisioning via password. In production, this should be `prohibit-password` (key-only) or `no` with a dedicated non-root Ansible user using `sudo`.

---

### 5. File Permissions (CIS 6.1.x)

| Control | CIS ID | Playbook | Task |
|---------|--------|----------|------|
| Ensure permissions on /etc/passwd are configured (0644) | 6.1.2 | `system_hardening.yml` | `Set proper permissions on /etc/passwd` |
| Ensure permissions on /etc/shadow are configured (0000) | 6.1.3 | `system_hardening.yml` | `Set proper permissions on /etc/shadow` |

**Implementation:**
```yaml
- name: Set proper permissions on /etc/passwd
  file:
    path: /etc/passwd
    mode: '0644'

- name: Set proper permissions on /etc/shadow
  file:
    path: /etc/shadow
    mode: '0000'
```

- `/etc/passwd` at `0644` — world-readable (usernames are not secrets), but only root can modify
- `/etc/shadow` at `0000` — no access for anyone except root (via DAC override capability), protecting password hashes

---

### 6. System Resource Limits (CIS 1.5.1)

| Control | CIS ID | Playbook | Task |
|---------|--------|----------|------|
| Ensure core dumps are restricted / resource limits set | 1.5.1 | `system_hardening.yml` | `Configure system limits for containers` |

**Implementation:**
```yaml
- name: Configure system limits for containers
  copy:
    dest: /etc/security/limits.d/kubernetes.conf
    content: |
      * soft nofile 65536
      * hard nofile 65536
      * soft nproc 65536
      * hard nproc 65536
```

Raises file descriptor and process limits to support high container density. Kubernetes nodes running many pods need these limits to avoid `too many open files` errors.

---

### 7. Time Synchronization (CIS 2.1.1)

| Control | CIS ID | Playbook | Task |
|---------|--------|----------|------|
| Ensure time is synchronized (UTC) | 2.1.1 | `system_hardening.yml` | `Set timezone to UTC` |

**Implementation:**
```yaml
- name: Set timezone to UTC
  timezone:
    name: UTC
```

Consistent timezone across all nodes ensures accurate log correlation and certificate validity checks. Kubernetes TLS certificates and token expiry depend on synchronized clocks.

---

## CIS Kubernetes Benchmark Controls Applied

Reference: **CIS Kubernetes Benchmark v1.8.0**

These controls are applied across multiple playbooks during provisioning.

### 1. Node Pre-Configuration (CIS 4.2.x — Kubelet)

| Control | CIS ID | Playbook | Task |
|---------|--------|----------|------|
| Disable swap on all nodes | 4.2.1 (prerequisite) | `preflight_check.yml` | `Disable swap` / `Remove swap from fstab` |
| Ensure kernel modules for networking are loaded | 4.2.x (prerequisite) | `preflight_check.yml` | `Load required kernel modules` |
| Ensure bridge traffic is passed to iptables | 4.2.x (prerequisite) | `preflight_check.yml` | `Set required sysctl params` |
| Ensure IP forwarding is enabled | 4.2.x (prerequisite) | `preflight_check.yml` | `Set required sysctl params` |

**Implementation:**
```yaml
# Swap must be disabled for kubelet to function
- name: Disable swap
  shell: swapoff -a

- name: Remove swap from fstab
  lineinfile:
    path: /etc/fstab
    regexp: '.*swap.*'
    state: absent

# Required kernel modules for container networking
- name: Load required kernel modules
  modprobe:
    name: "{{ item }}"
  loop:
    - overlay        # OverlayFS for container layers
    - br_netfilter   # Bridge netfilter for iptables

# Required sysctl settings for Kubernetes networking
- name: Set required sysctl params
  sysctl:
    name: "{{ item.name }}"
    value: "{{ item.value }}"
  loop:
    - { name: 'net.bridge.bridge-nf-call-iptables', value: '1' }
    - { name: 'net.bridge.bridge-nf-call-ip6tables', value: '1' }
    - { name: 'net.ipv4.ip_forward', value: '1' }
```

**Why these matter:**
- **Swap disabled** — kubelet refuses to start with swap enabled; memory limits on pods become unpredictable with swap
- **overlay** — Required by containerd for container filesystem layers
- **br_netfilter** — Allows iptables to process bridged traffic (pod-to-pod communication)
- **net.bridge.bridge-nf-call-iptables=1** — Ensures NetworkPolicy and Service routing work correctly
- **net.ipv4.ip_forward=1** — Required for pod network traffic routing between nodes

---

### 2. Container Runtime Security (CIS 1.2.x / 4.2.6)

| Control | CIS ID | Playbook | Task |
|---------|--------|----------|------|
| Use containerd as container runtime (not Docker shim) | 1.2.1 | `install_containerd.yml` | `Install containerd` |
| Configure systemd cgroup driver | 4.2.6 | `install_containerd.yml` | `Configure containerd to use systemd cgroup driver` |
| Verify CRI socket connectivity | 4.2.x | `install_containerd.yml` | `Test containerd with crictl` |

**Implementation:**
```yaml
# Regenerate config to ensure clean state
- name: Generate default containerd config
  shell: containerd config default > /etc/containerd/config.toml

# Set systemd cgroup driver (critical for kubelet compatibility)
- name: Configure containerd to use systemd cgroup driver
  replace:
    path: /etc/containerd/config.toml
    regexp: 'SystemdCgroup = false'
    replace: 'SystemdCgroup = true'
```

**Why SystemdCgroup = true:**
- Kubernetes v1.22+ requires the container runtime and kubelet to use the **same cgroup driver**
- systemd is the init system on Rocky Linux 9 and manages cgroup hierarchy
- Mismatched cgroup drivers cause kubelet to crash or containers to fail with `CRI` errors
- CIS Benchmark 4.2.6 requires consistent cgroup management

---

### 3. Control Plane Initialization (CIS 1.1.x / 1.2.x / 1.3.x)

| Control | CIS ID | Playbook | Task |
|---------|--------|----------|------|
| Use kubeadm for cluster bootstrapping (secure defaults) | 1.1.x | `init_control_plane.yml` | `Initialize Kubernetes cluster` |
| Restrict kubeconfig file permissions | 1.1.13 | `init_control_plane.yml` | `Copy admin.conf to root's kube config` |
| Specify pod network CIDR | 1.2.x | `init_control_plane.yml` | `kubeadm init --pod-network-cidr` |
| Store join token securely | 1.1.x | `init_control_plane.yml` | `Save join command to file` (mode 0700) |

**Implementation:**
```yaml
- name: Initialize Kubernetes cluster
  shell: |
    kubeadm init \
      --pod-network-cidr=10.244.0.0/16 \
      --kubernetes-version=1.28.3 \
      --apiserver-advertise-address={{ ansible_host }}

# Kubeconfig with restricted permissions
- name: Copy admin.conf to root's kube config
  copy:
    src: /etc/kubernetes/admin.conf
    dest: /root/.kube/config
    remote_src: yes
    mode: '0600'    # Only root can read

# Join token stored with restricted access
- name: Save join command to file on control plane
  copy:
    content: "{{ join_command.stdout }}"
    dest: /root/kubeadm_join_command.sh
    mode: '0700'    # Only root can execute
```

**kubeadm secure defaults applied automatically:**
- API Server: TLS certificates auto-generated
- etcd: Encrypted communication with auto-generated certificates
- Controller Manager: Uses service account credentials
- Scheduler: Runs with restricted permissions
- kubelet: Client certificate rotation enabled
- RBAC: Enabled by default
- Static pod manifests: Secured at `/etc/kubernetes/manifests/` (root-only)
- PKI: Stored in `/etc/kubernetes/pki/` (root-only, mode 0600)

---

### 4. Network Policy Support (CIS 5.2.x / 5.3.x)

| Control | CIS ID | Playbook | Task |
|---------|--------|----------|------|
| Install a CNI plugin that supports NetworkPolicy | 5.3.1 | `install_cni_calico.yml` | `Apply Calico manifest` |
| Ensure CNI is operational | 5.3.2 | `install_cni_calico.yml` | `Wait for Calico pods to be ready` |

**Implementation:**
```yaml
- name: Download Calico manifest
  get_url:
    url: "https://raw.githubusercontent.com/projectcalico/calico/v3.26.4/manifests/calico.yaml"
    dest: /root/calico.yaml

- name: Apply Calico manifest
  shell: kubectl apply -f /root/calico.yaml
```

**Why Calico:**
- Supports Kubernetes **NetworkPolicy** resources (CIS 5.3.1 requires a CNI that supports NetworkPolicy)
- Provides pod-to-pod encryption capabilities (WireGuard)
- IP-in-IP or VXLAN encapsulation for cross-node pod traffic
- Without a NetworkPolicy-capable CNI, all pods can communicate freely — violating network segmentation requirements

---

### 5. Cluster Validation (CIS 5.1.x)

| Control | CIS ID | Playbook | Task |
|---------|--------|----------|------|
| Verify all nodes are in Ready state | 5.1.x | `final_validation.yml` | `Get all nodes` |
| Verify system components are running | 5.1.x | `final_validation.yml` | `Get all system pods` |
| Validate workload scheduling works | 5.1.x | `final_validation.yml` | `Deploy test nginx pod` |
| Clean up test resources | 5.1.x | `final_validation.yml` | `Clean up test pod` |

---

### 6. Kubernetes Package Integrity (CIS 1.1.x)

| Control | CIS ID | Playbook | Task |
|---------|--------|----------|------|
| Install packages from official signed repository | 1.1.x | `install_kubernetes.yml` | `Add Kubernetes repository` with GPG check |
| Pin specific Kubernetes version | 1.1.x | `install_kubernetes.yml` | `Install Kubernetes packages` with version pin |

**Implementation:**
```yaml
- name: Add Kubernetes repository
  yum_repository:
    name: kubernetes
    baseurl: https://pkgs.k8s.io/core:/stable:/v1.28/rpm/
    gpgcheck: yes    # Verify package signatures
    gpgkey: https://pkgs.k8s.io/core:/stable:/v1.28/rpm/repodata/repomd.xml.key

- name: Install Kubernetes packages
  dnf:
    name:
      - kubelet-1.28.3
      - kubeadm-1.28.3
      - kubectl-1.28.3
    state: present
```

GPG checking ensures packages are not tampered with. Version pinning prevents unexpected upgrades that could introduce vulnerabilities or break cluster compatibility.

---

## Platform-Level Security (Application Layer)

Beyond CIS benchmarks, the K8s Provisioner platform itself implements these security measures:

| Security Measure | Implementation |
|------------------|----------------|
| **JWT Authentication** | HS256 tokens with configurable expiry (default 30 min) |
| **Password Hashing** | bcrypt with salt rounds |
| **SSH Credential Encryption** | Fernet symmetric encryption for private keys and passwords stored in PostgreSQL |
| **CORS Restriction** | Configurable `ALLOWED_ORIGINS` to restrict cross-origin API access |
| **Host Key Checking** | Disabled for LAB; should be enabled in production |

---

## Summary Table: All Hardening Tasks by Playbook

| Playbook | Task | CIS Control |
|----------|------|-------------|
| `preflight_check.yml` | Disable swap | K8s 4.2.1 prerequisite |
| `preflight_check.yml` | Load overlay, br_netfilter modules | K8s 4.2.x prerequisite |
| `preflight_check.yml` | Set bridge-nf-call-iptables, ip_forward | K8s 4.2.x prerequisite |
| `preflight_check.yml` | Stop firewalld | LAB only (not CIS) |
| `system_hardening.yml` | Update all packages | Linux 1.9 |
| `system_hardening.yml` | Install audit, policycoreutils, selinux-policy | Linux 4.1.1.1, 1.6.1.1 |
| `system_hardening.yml` | Set SELinux to permissive | Linux 1.6.1.3 |
| `system_hardening.yml` | Disable SSH empty passwords | Linux 5.2.11 |
| `system_hardening.yml` | Set /etc/passwd to 0644 | Linux 6.1.2 |
| `system_hardening.yml` | Set /etc/shadow to 0000 | Linux 6.1.3 |
| `system_hardening.yml` | Enable auditd | Linux 4.1.1.2 |
| `system_hardening.yml` | Set timezone to UTC | Linux 2.1.1 |
| `system_hardening.yml` | Configure container resource limits | Linux 1.5.1 |
| `install_containerd.yml` | Install containerd from signed repo | K8s 1.2.1 |
| `install_containerd.yml` | Set SystemdCgroup = true | K8s 4.2.6 |
| `install_kubernetes.yml` | Install from GPG-signed repo | K8s 1.1.x |
| `install_kubernetes.yml` | Pin K8s version | K8s 1.1.x |
| `init_control_plane.yml` | kubeadm init (TLS, RBAC, PKI) | K8s 1.1-1.3 |
| `init_control_plane.yml` | Kubeconfig at mode 0600 | K8s 1.1.13 |
| `init_control_plane.yml` | Join token at mode 0700 | K8s 1.1.x |
| `install_cni_calico.yml` | Install NetworkPolicy-capable CNI | K8s 5.3.1 |
| `final_validation.yml` | Verify cluster health | K8s 5.1.x |

---

## Additional Kubernetes Configuration (from "3. K8s environment setup.docx")

Section 5 of the reference document specifies additional kubelet configuration for resource protection and stability. These are **NOT currently implemented** in the provisioner playbooks and must be applied manually or added to a future playbook.

### What the Document Specifies

The document requires patching `/var/lib/kubelet/config.yaml` on each node with:

```yaml
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration

# Cgroup driver (already handled by containerd config)
cgroupDriver: systemd

# Reserve resources for OS processes (HAProxy, Keepalived, SSH, systemd, etc.)
# Prevents pods from starving the host OS
systemReserved:
  cpu: "500m"
  memory: "1Gi"

# Maximum PIDs per pod - prevents fork bombs or runaway pods
podPidsLimit: 2048

# Hard eviction thresholds - kubelet evicts pods immediately when breached
# Protects control-plane stability under memory pressure
evictionHard:
  memory.available: "500Mi"

# Reserve resources for Kubernetes components (API server, etcd, controller-manager, scheduler)
# Apply on MASTER/CONTROL-PLANE nodes only
kubeReserved:
  cpu: "1000m"
  memory: "2Gi"
```

### Why Each Setting Matters

| Setting | Purpose | What Happens Without It |
|---------|---------|------------------------|
| `systemReserved` | Reserves CPU/memory for OS-level services (systemd, sshd, auditd) | Pods can consume all resources, making the node unresponsive via SSH |
| `kubeReserved` | Reserves CPU/memory for K8s components (kubelet, kube-proxy, containerd) | Under heavy pod load, kubelet itself can be OOM-killed, crashing the node |
| `podPidsLimit: 2048` | Caps process count per pod | A single pod running a fork bomb can exhaust the PID table, killing all processes on the node |
| `evictionHard.memory.available: 500Mi` | Evicts pods when free memory drops below 500Mi | Node hits OOM, kernel kills processes randomly (including kubelet or etcd) |

### Current Project Status

| Configuration | Status | Where |
|---------------|--------|-------|
| `cgroupDriver: systemd` | **Implemented** | `install_containerd.yml` — `SystemdCgroup = true` in containerd config |
| `systemReserved` | **Not implemented** | Needs kubelet config patch |
| `kubeReserved` | **Not implemented** | Needs kubelet config patch (master only) |
| `podPidsLimit` | **Not implemented** | Needs kubelet config patch |
| `evictionHard` | **Not implemented** | Needs kubelet config patch |

### Additional Items from Reference Documents (1. Install K8s.docx)

The install document also specifies kernel tuning parameters beyond what the current playbooks apply:

```bash
# Currently implemented in preflight_check.yml:
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1

# NOT implemented (from reference doc):
net.netfilter.nf_conntrack_max = 262144    # Connection tracking table size for kube-proxy/services
fs.file-max = 1048576                       # System-wide file descriptor limit
vm.max_map_count = 262144                   # Required by workloads like Elasticsearch

# NOT implemented - higher resource limits from reference doc:
# /etc/security/limits.conf
root soft nofile 1048576    # Current playbook sets 65536
root hard nofile 1048576    # Current playbook sets 65536
root soft nproc 1048576     # Current playbook sets 65536
root hard nproc 1048576     # Current playbook sets 65536
```

| Sysctl / Limit | Current Value | Reference Doc Value | Impact |
|----------------|---------------|---------------------|--------|
| `nf_conntrack_max` | Not set (kernel default ~65536) | 262144 | Prevents conntrack table overflow under heavy Service/NodePort traffic |
| `fs.file-max` | Not set (kernel default) | 1048576 | Prevents "too many open files" at high pod density |
| `vm.max_map_count` | Not set (kernel default 65530) | 262144 | Required for Elasticsearch, JVM-heavy workloads |
| `nofile` limits | 65536 | 1048576 | Higher ceiling for production workloads with many connections |
| `nproc` limits | 65536 | 1048576 | Higher process limit for production |

### How to Apply These Manually (Post-Provisioning)

**Step 1: Kubelet config (all nodes)**
```bash
# SSH to each node and edit kubelet config
vi /var/lib/kubelet/config.yaml

# Add under the existing config:
systemReserved:
  cpu: "500m"
  memory: "1Gi"
podPidsLimit: 2048
evictionHard:
  memory.available: "500Mi"
```

**Step 2: Kubelet config (master nodes only)**
```bash
# Add additionally on master/control-plane nodes:
kubeReserved:
  cpu: "1000m"
  memory: "2Gi"
```

**Step 3: Kernel tuning (all nodes)**
```bash
cat << EOF | sudo tee /etc/sysctl.d/k8s-production.conf
net.netfilter.nf_conntrack_max = 262144
fs.file-max = 1048576
vm.max_map_count = 262144
EOF
sudo sysctl --system
```

**Step 4: Restart kubelet**
```bash
sudo systemctl restart kubelet
```

---

## LAB vs Production Differences

| Setting | LAB (Current) | Production (Recommended) |
|---------|---------------|--------------------------|
| SELinux | `permissive` | `enforcing` with custom policy |
| Firewall | Disabled | Enabled with K8s ports only |
| Root SSH | `PermitRootLogin yes` | `PermitRootLogin no` or `prohibit-password` |
| SSH Auth | Password | Key-only |
| Host Key Checking | Disabled | Enabled |
| Admin Password | `AdminPassword123!` | Strong randomly generated password |
| SECRET_KEY | Static in .env | Generated per deployment: `openssl rand -hex 32` |
| ENCRYPTION_KEY | Static in .env | Generated per deployment via Fernet |
| Audit Rules | Default | Custom rules for K8s paths (`/etc/kubernetes/`, `/var/lib/kubelet/`) |
| etcd Encryption | Default (at-rest not encrypted) | Enable `EncryptionConfiguration` for secrets |
| Pod Security | None | PodSecurity admission (restricted/baseline) |
| NetworkPolicy | None applied | Default-deny + explicit allow policies |
| systemReserved | Not set | `cpu: 500m, memory: 1Gi` |
| kubeReserved (masters) | Not set | `cpu: 1000m, memory: 2Gi` |
| podPidsLimit | Not set | `2048` |
| evictionHard | Not set | `memory.available: 500Mi` |
| nf_conntrack_max | Kernel default | `262144` |
| fs.file-max | Kernel default | `1048576` |
| nofile / nproc limits | `65536` | `1048576` |
