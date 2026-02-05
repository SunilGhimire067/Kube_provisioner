import { z } from 'zod';

// Step 1: Basic Information
export const basicInfoSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Name must contain only lowercase letters, numbers, and hyphens')
    .regex(/^[a-z0-9]/, 'Name must start with an alphanumeric character')
    .regex(/[a-z0-9]$/, 'Name must end with an alphanumeric character'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  isHA: z.boolean(),
  controlPlaneCount: z.number()
    .int('Must be a whole number')
    .min(1, 'Must have at least 1 control plane node'),
  workerCount: z.number()
    .int('Must be a whole number')
    .min(0, 'Worker count cannot be negative'),
}).refine(
  (data) => {
    if (data.isHA) {
      return data.controlPlaneCount >= 3 && data.controlPlaneCount % 2 !== 0;
    }
    return true;
  },
  {
    message: 'HA clusters require at least 3 control plane nodes (must be odd number)',
    path: ['controlPlaneCount'],
  }
);

export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

// Step 2: Component Selection
export const componentsSchema = z.object({
  kubernetes_version: z.string().min(1, 'Kubernetes version is required'),
  cni: z.enum(['calico', 'cilium', 'flannel'], {
    errorMap: () => ({ message: 'Please select a CNI plugin' }),
  }),
  traffic_management_type: z.enum(['gateway-api', 'ingress', 'none'], {
    errorMap: () => ({ message: 'Please select a traffic management type' }),
  }),
  gateway_api_controller: z.enum(['istio', 'kong', 'envoy-gateway', 'nginx-gateway-fabric', 'cilium']).optional(),
  ingress_controller: z.enum(['nginx', 'haproxy', 'traefik']).optional(),
  runtime: z.enum(['containerd'], {
    errorMap: () => ({ message: 'Please select a container runtime' }),
  }),
  monitoring: z.boolean(),
  logging: z.boolean(),
}).refine(
  (data) => {
    if (data.traffic_management_type === 'gateway-api') {
      return !!data.gateway_api_controller;
    }
    return true;
  },
  {
    message: 'Gateway API controller is required when using Gateway API',
    path: ['gateway_api_controller'],
  }
).refine(
  (data) => {
    if (data.traffic_management_type === 'ingress') {
      return !!data.ingress_controller;
    }
    return true;
  },
  {
    message: 'Ingress controller is required when using traditional ingress',
    path: ['ingress_controller'],
  }
).refine(
  (data) => {
    // If Cilium Gateway is selected, CNI must be Cilium
    if (data.gateway_api_controller === 'cilium' && data.cni !== 'cilium') {
      return false;
    }
    return true;
  },
  {
    message: 'Cilium Gateway requires Cilium CNI',
    path: ['gateway_api_controller'],
  }
);

export type ComponentsFormData = z.infer<typeof componentsSchema>;

// Step 3: Node Configuration
const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;

export const nodeSchema = z.object({
  name: z.string()
    .min(1, 'Node name is required')
    .max(63, 'Node name must be less than 63 characters')
    .regex(/^[a-z0-9-]+$/, 'Node name must contain only lowercase letters, numbers, and hyphens'),
  role: z.enum(['control-plane', 'worker'], {
    errorMap: () => ({ message: 'Please select a node role' }),
  }),
  ip_address: z.string()
    .regex(ipv4Regex, 'Invalid IP address format')
    .refine(
      (ip) => {
        const parts = ip.split('.').map(Number);
        return parts.every((part) => part >= 0 && part <= 255);
      },
      { message: 'IP address octets must be between 0 and 255' }
    ),
  ssh_port: z.number()
    .int('Port must be a whole number')
    .min(1, 'Port must be at least 1')
    .max(65535, 'Port must be at most 65535'),
  os_type: z.enum(['ubuntu22', 'rocky9', 'rhel9'], {
    errorMap: () => ({ message: 'Please select an OS type' }),
  }),
});

export type NodeFormData = z.infer<typeof nodeSchema>;

export const nodesArraySchema = z.array(nodeSchema)
  .min(1, 'At least one node is required')
  .refine(
    (nodes) => {
      const controlPlaneCount = nodes.filter((n) => n.role === 'control-plane').length;
      return controlPlaneCount >= 1;
    },
    { message: 'At least one control plane node is required' }
  )
  .refine(
    (nodes) => {
      const ips = nodes.map((n) => n.ip_address);
      const uniqueIps = new Set(ips);
      return ips.length === uniqueIps.size;
    },
    { message: 'Duplicate IP addresses are not allowed' }
  )
  .refine(
    (nodes) => {
      const names = nodes.map((n) => n.name);
      const uniqueNames = new Set(names);
      return names.length === uniqueNames.size;
    },
    { message: 'Duplicate node names are not allowed' }
  );

// Step 4: SSH Authentication
export const sshConfigSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  auth_method: z.enum(['password', 'private_key'], {
    errorMap: () => ({ message: 'Please select an authentication method' }),
  }),
  password: z.string().optional(),
  private_key: z.string().optional(),
  passphrase: z.string().optional(),
}).refine(
  (data) => {
    if (data.auth_method === 'password') {
      return !!data.password && data.password.length > 0;
    }
    return true;
  },
  {
    message: 'Password is required when using password authentication',
    path: ['password'],
  }
).refine(
  (data) => {
    if (data.auth_method === 'private_key') {
      return !!data.private_key && data.private_key.length > 0;
    }
    return true;
  },
  {
    message: 'Private key is required when using key-based authentication',
    path: ['private_key'],
  }
);

export type SSHConfigFormData = z.infer<typeof sshConfigSchema>;

// Step 5: Hardening Options
export const hardeningSchema = z.object({
  cis_k8s_benchmark: z.boolean(),
  cis_linux_benchmark: z.boolean(),
  pod_security_standards: z.enum(['restricted', 'baseline', 'privileged'], {
    errorMap: () => ({ message: 'Please select a pod security standard' }),
  }),
  additional_k8s_config: z.boolean(),
});

export type HardeningFormData = z.infer<typeof hardeningSchema>;

// Complete cluster creation validation (for reference, not used directly)
export const clusterCreateSchema = z.object({
  basicInfo: basicInfoSchema,
  components: componentsSchema,
  nodes: nodesArraySchema,
  sshConfig: sshConfigSchema,
  hardening: hardeningSchema,
});

export type ClusterCreateFormData = z.infer<typeof clusterCreateSchema>;
