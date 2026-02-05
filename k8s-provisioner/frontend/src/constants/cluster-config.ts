// Cluster configuration constants and dropdown options

export const K8S_VERSIONS = [
  '1.28.3',
  '1.28.2',
  '1.28.1',
  '1.28.0',
  '1.27.0',
  '1.26.0',
];

export const CNI_OPTIONS = [
  { value: 'calico', label: 'Calico', description: 'Network policy and security' },
  { value: 'cilium', label: 'Cilium', description: 'eBPF-based networking and security' },
  { value: 'flannel', label: 'Flannel', description: 'Simple overlay network' },
];

// Traffic Management Type
export const TRAFFIC_MANAGEMENT_TYPE = [
  { value: 'gateway-api', label: 'Gateway API (Recommended)', description: 'Modern, standardized traffic management' },
  { value: 'ingress', label: 'Traditional Ingress', description: 'Legacy ingress controllers (NGINX EOL March 2026)' },
  { value: 'none', label: 'None', description: 'Skip traffic management installation' },
];

// Gateway API Controllers
export const GATEWAY_API_CONTROLLERS = [
  { value: 'istio', label: 'Istio Gateway', description: 'Service mesh with Gateway API support' },
  { value: 'kong', label: 'Kong Gateway', description: 'API gateway with Gateway API' },
  { value: 'envoy-gateway', label: 'Envoy Gateway', description: 'Official Envoy-based Gateway API implementation' },
  { value: 'nginx-gateway-fabric', label: 'NGINX Gateway Fabric', description: 'NGINX Gateway API implementation' },
  { value: 'cilium', label: 'Cilium Gateway', description: 'eBPF-based Gateway API (requires Cilium CNI)' },
];

// Legacy Ingress Controllers (Deprecated)
export const INGRESS_OPTIONS = [
  { value: 'nginx', label: 'NGINX Ingress', description: 'Community NGINX (EOL March 2026)' },
  { value: 'haproxy', label: 'HAProxy Ingress', description: 'High performance load balancer' },
  { value: 'traefik', label: 'Traefik Ingress', description: 'Modern HTTP reverse proxy' },
];

export const RUNTIME_OPTIONS = [
  { value: 'containerd', label: 'containerd', description: 'Industry standard container runtime' },
];

export const OS_OPTIONS = [
  { value: 'ubuntu22', label: 'Ubuntu 22.04', description: 'Ubuntu Server 22.04 LTS' },
  { value: 'rocky9', label: 'Rocky Linux 9', description: 'RHEL-compatible' },
  { value: 'rhel9', label: 'RHEL 9', description: 'Red Hat Enterprise Linux 9' },
];

export const NODE_ROLES = [
  { value: 'control-plane', label: 'Control Plane', description: 'Master node' },
  { value: 'worker', label: 'Worker', description: 'Worker node for workloads' },
];

export const POD_SECURITY_STANDARDS = [
  { value: 'restricted', label: 'Restricted', description: 'Most restrictive policy' },
  { value: 'baseline', label: 'Baseline', description: 'Minimally restrictive' },
  { value: 'privileged', label: 'Privileged', description: 'Unrestricted policy' },
];

export const AUTH_METHODS = [
  { value: 'password', label: 'Password', description: 'SSH password authentication' },
  { value: 'private_key', label: 'Private Key', description: 'SSH key-based authentication' },
];

// Default values
export const DEFAULT_SSH_PORT = 22;
export const DEFAULT_CONTROL_PLANE_COUNT_HA = 3;
export const DEFAULT_WORKER_COUNT = 2;
export const DEFAULT_SSH_USERNAME = 'root';
export const MIN_CONTROL_PLANE_HA = 3;

// Wizard steps
export const WIZARD_STEPS = [
  'Basic Information',
  'Component Selection',
  'Node Configuration',
  'SSH Authentication',
  'Review & Provision',
];
