// Cluster creation wizard type definitions

export type NodeRole = 'control-plane' | 'worker';
export type OSType = 'ubuntu22' | 'rocky9' | 'rhel9';
export type CNIType = 'calico' | 'cilium' | 'flannel';
export type TrafficManagementType = 'gateway-api' | 'ingress' | 'none';
export type GatewayAPIController = 'istio' | 'kong' | 'envoy-gateway' | 'nginx-gateway-fabric' | 'cilium';
export type IngressType = 'nginx' | 'haproxy' | 'traefik';
export type RuntimeType = 'containerd';
export type AuthMethod = 'password' | 'private_key';
export type PodSecurityStandard = 'restricted' | 'baseline' | 'privileged';

export interface NodeData {
  name: string;
  role: NodeRole;
  ip_address: string;
  ssh_port: number;
  os_type: OSType;
}

export interface BasicInfoData {
  name: string;
  description?: string;
  isHA: boolean;
  controlPlaneCount: number;
  workerCount: number;
}

export interface ComponentsData {
  kubernetes_version: string;
  cni: CNIType;
  traffic_management_type: TrafficManagementType;
  gateway_api_controller?: GatewayAPIController;
  ingress_controller?: IngressType;
  runtime: RuntimeType;
  monitoring: boolean;
  logging: boolean;
}

export interface SSHConfigData {
  username: string;
  auth_method: AuthMethod;
  password?: string;
  private_key?: string;
  passphrase?: string;
}

export interface HardeningData {
  cis_k8s_benchmark: boolean;
  cis_linux_benchmark: boolean;
  pod_security_standards: PodSecurityStandard;
  additional_k8s_config: boolean;
}

export interface WizardData {
  basicInfo: BasicInfoData;
  components: ComponentsData;
  nodes: NodeData[];
  sshConfig: SSHConfigData;
  hardening: HardeningData;
}

// API request payload format
export interface ClusterCreatePayload {
  name: string;
  description?: string;
  topology: {
    ha: boolean;
    control_plane_count: number;
    worker_count: number;
  };
  components: {
    kubernetes_version: string;
    cni: string;
    traffic_management_type: string;
    gateway_api_controller?: string;
    ingress_controller?: string;
    runtime: string;
    monitoring: boolean;
    logging: boolean;
  };
  nodes: Array<{
    name: string;
    role: string;
    ip_address: string;
    ssh_port: number;
    os_type: string;
  }>;
  ssh_config: {
    username: string;
    auth_method: string;
    password?: string;
    private_key?: string;
    passphrase?: string;
  };
  hardening?: {
    cis_k8s_benchmark: boolean;
    cis_linux_benchmark: boolean;
    pod_security_standards: string;
    additional_k8s_config: boolean;
  };
  provision_immediately: boolean;
}

// API response types
export interface ClusterResponse {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export interface JobResponse {
  id: string;
  type: string;
  status: string;
  created_at: string;
}

export interface ClusterCreateResponse {
  cluster: ClusterResponse;
  job?: JobResponse;
}

// SSH test response
export interface SSHTestResponse {
  success: boolean;
  message?: string;
  results?: Array<{
    node: string;
    success: boolean;
    error?: string;
  }>;
}
