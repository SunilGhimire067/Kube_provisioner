import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControlLabel,
  Checkbox,
  MenuItem,
  TextField,
  Alert,
  Collapse,
} from '@mui/material';
import { VerifiedUser } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { hardeningSchema, HardeningFormData } from '../../utils/validation-schemas';
import { WizardData, HardeningData } from '../../types/cluster';
import { POD_SECURITY_STANDARDS } from '../../constants/cluster-config';

interface Step5ReviewProvisionProps {
  wizardData: WizardData;
  onUpdateHardening: (data: HardeningData) => void;
}

const ReviewSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5, mt: 2,
      background: 'rgba(17, 24, 39, 0.5)',
      border: '1px solid rgba(0, 212, 255, 0.08)',
    }}
  >
    <Typography
      variant="subtitle2"
      sx={{ color: '#00d4ff', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5 }}
    >
      {title}
    </Typography>
    <Divider sx={{ mb: 2, borderColor: 'rgba(0, 212, 255, 0.06)' }} />
    {children}
  </Paper>
);

const ReviewField = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box>
    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ color: '#e2e8f0', mt: 0.25 }}>{value}</Typography>
  </Box>
);

const Step5ReviewProvision: React.FC<Step5ReviewProvisionProps> = ({ wizardData, onUpdateHardening }) => {
  const { basicInfo, components, nodes, sshConfig, hardening } = wizardData;

  const {
    control,
    watch,
    formState: { errors },
    getValues,
  } = useForm<HardeningFormData>({
    resolver: zodResolver(hardeningSchema),
    defaultValues: hardening,
    mode: 'onChange',
  });

  const additionalK8sConfig = watch('additional_k8s_config');
  const controlPlaneNodes = nodes.filter((n) => n.role === 'control-plane');
  const workerNodes = nodes.filter((n) => n.role === 'worker');

  useEffect(() => {
    const subscription = watch((formData) => {
      const values = getValues();
      onUpdateHardening(values as HardeningData);
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, onUpdateHardening]);

  const StatusChip = ({ enabled }: { enabled: boolean }) => (
    <Chip
      label={enabled ? 'Enabled' : 'Disabled'}
      size="small"
      sx={{
        bgcolor: enabled ? 'rgba(0, 230, 118, 0.1)' : 'rgba(148, 163, 184, 0.1)',
        color: enabled ? '#00e676' : '#64748b',
        border: `1px solid ${enabled ? 'rgba(0, 230, 118, 0.2)' : 'rgba(148, 163, 184, 0.15)'}`,
        fontWeight: 600, fontSize: '0.65rem',
      }}
    />
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <VerifiedUser sx={{ color: '#00e676', fontSize: 22 }} />
        <Typography variant="h6" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
          Review & Provision
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
        Review your configuration and choose security hardening options
      </Typography>

      {/* Basic Information */}
      <ReviewSection title="Basic Information">
        <Grid container spacing={2}>
          <Grid item xs={6}><ReviewField label="Cluster Name" value={basicInfo.name} /></Grid>
          <Grid item xs={6}><ReviewField label="High Availability" value={<StatusChip enabled={basicInfo.isHA} />} /></Grid>
          {basicInfo.description && (
            <Grid item xs={12}><ReviewField label="Description" value={basicInfo.description} /></Grid>
          )}
          <Grid item xs={6}><ReviewField label="Control Plane Nodes" value={basicInfo.controlPlaneCount} /></Grid>
          <Grid item xs={6}><ReviewField label="Worker Nodes" value={basicInfo.workerCount} /></Grid>
        </Grid>
      </ReviewSection>

      {/* Components */}
      <ReviewSection title="Components">
        <Grid container spacing={2}>
          <Grid item xs={6}><ReviewField label="Kubernetes Version" value={components.kubernetes_version} /></Grid>
          <Grid item xs={6}><ReviewField label="Container Runtime" value={components.runtime} /></Grid>
          <Grid item xs={6}><ReviewField label="CNI Plugin" value={components.cni} /></Grid>
          <Grid item xs={6}>
            <ReviewField label="Traffic Management" value={
              components.traffic_management_type === 'gateway-api' ? 'Gateway API' :
              components.traffic_management_type === 'ingress' ? 'Traditional Ingress' : 'None'
            } />
          </Grid>
          {components.traffic_management_type === 'gateway-api' && components.gateway_api_controller && (
            <Grid item xs={6}><ReviewField label="Gateway API Controller" value={components.gateway_api_controller} /></Grid>
          )}
          {components.traffic_management_type === 'ingress' && components.ingress_controller && (
            <Grid item xs={6}><ReviewField label="Ingress Controller" value={components.ingress_controller} /></Grid>
          )}
          <Grid item xs={6}><ReviewField label="Monitoring" value={<StatusChip enabled={components.monitoring} />} /></Grid>
          <Grid item xs={6}><ReviewField label="Logging" value={<StatusChip enabled={components.logging} />} /></Grid>
        </Grid>
      </ReviewSection>

      {/* Nodes */}
      <ReviewSection title={`Nodes (${nodes.length} total)`}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>Port</TableCell>
                <TableCell>OS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {controlPlaneNodes.map((node, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem' }}>{node.name}</TableCell>
                  <TableCell>
                    <Chip label="Control Plane" size="small" sx={{ bgcolor: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff', border: '1px solid rgba(0, 212, 255, 0.2)', fontWeight: 600, fontSize: '0.65rem' }} />
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', color: '#00d4ff' }}>{node.ip_address}</TableCell>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem' }}>{node.ssh_port}</TableCell>
                  <TableCell>{node.os_type}</TableCell>
                </TableRow>
              ))}
              {workerNodes.map((node, idx) => (
                <TableRow key={idx}>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem' }}>{node.name}</TableCell>
                  <TableCell>
                    <Chip label="Worker" size="small" sx={{ bgcolor: 'rgba(124, 77, 255, 0.1)', color: '#b47cff', border: '1px solid rgba(124, 77, 255, 0.2)', fontWeight: 600, fontSize: '0.65rem' }} />
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem', color: '#00d4ff' }}>{node.ip_address}</TableCell>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem' }}>{node.ssh_port}</TableCell>
                  <TableCell>{node.os_type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </ReviewSection>

      {/* SSH Configuration */}
      <ReviewSection title="SSH Configuration">
        <Grid container spacing={2}>
          <Grid item xs={6}><ReviewField label="Username" value={sshConfig.username} /></Grid>
          <Grid item xs={6}><ReviewField label="Authentication Method" value={sshConfig.auth_method === 'password' ? 'Password' : 'Private Key'} /></Grid>
        </Grid>
      </ReviewSection>

      {/* Security Hardening */}
      <ReviewSection title="Security Hardening">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Controller
              name="cis_k8s_benchmark"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ color: '#e2e8f0' }}>Apply CIS Kubernetes Benchmark</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Apply security best practices from CIS Kubernetes Benchmark
                      </Typography>
                    </Box>
                  }
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="cis_linux_benchmark"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ color: '#e2e8f0' }}>Apply CIS Linux Benchmark</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Harden the OS according to CIS Linux Benchmark
                      </Typography>
                    </Box>
                  }
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              name="pod_security_standards"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Pod Security Standards"
                  fullWidth
                  required
                  error={!!errors.pod_security_standards}
                  helperText={errors.pod_security_standards?.message || 'Select pod security policy level'}
                >
                  {POD_SECURITY_STANDARDS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
        </Grid>
      </ReviewSection>

      {/* Additional K8s Config */}
      <ReviewSection title="Additional Kubernetes Configuration">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Controller
              name="additional_k8s_config"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                        Apply Additional Kubernetes Configuration
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Configure kubelet resource reservations, eviction policies, PID limits, and kernel tuning
                      </Typography>
                    </Box>
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Collapse in={additionalK8sConfig}>
              <Box sx={{ mt: 1 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  The following configurations will be applied after the cluster is fully provisioned.
                  These settings protect node stability by reserving resources for system and Kubernetes components.
                </Alert>

                <Paper
                  variant="outlined"
                  sx={{ p: 2, mb: 2, background: 'rgba(0, 212, 255, 0.03)', borderColor: 'rgba(0, 212, 255, 0.1)' }}
                >
                  <Typography variant="subtitle2" sx={{ color: '#00d4ff', mb: 1 }}>
                    Control Plane Nodes ({controlPlaneNodes.length} node{controlPlaneNodes.length !== 1 ? 's' : ''})
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Setting</TableCell>
                          <TableCell>Value</TableCell>
                          <TableCell>Purpose</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell><code>systemReserved</code></TableCell>
                          <TableCell>cpu: 500m, memory: 1Gi</TableCell>
                          <TableCell>Reserve resources for OS processes (sshd, systemd, auditd)</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><code>kubeReserved</code></TableCell>
                          <TableCell>cpu: 1000m, memory: 2Gi</TableCell>
                          <TableCell>Reserve resources for K8s components (API server, etcd, kubelet)</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><code>podPidsLimit</code></TableCell>
                          <TableCell>2048</TableCell>
                          <TableCell>Max processes per pod (prevents fork bombs)</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><code>evictionHard</code></TableCell>
                          <TableCell>memory.available: 500Mi</TableCell>
                          <TableCell>Evict pods when free memory drops below threshold</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{ p: 2, mb: 2, background: 'rgba(124, 77, 255, 0.03)', borderColor: 'rgba(124, 77, 255, 0.1)' }}
                >
                  <Typography variant="subtitle2" sx={{ color: '#b47cff', mb: 1 }}>
                    Worker Nodes ({workerNodes.length} node{workerNodes.length !== 1 ? 's' : ''})
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Setting</TableCell>
                          <TableCell>Value</TableCell>
                          <TableCell>Purpose</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell><code>systemReserved</code></TableCell>
                          <TableCell>cpu: 500m, memory: 1Gi</TableCell>
                          <TableCell>Reserve resources for OS processes (sshd, systemd, auditd)</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><code>podPidsLimit</code></TableCell>
                          <TableCell>2048</TableCell>
                          <TableCell>Max processes per pod (prevents fork bombs)</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><code>evictionHard</code></TableCell>
                          <TableCell>memory.available: 500Mi</TableCell>
                          <TableCell>Evict pods when free memory drops below threshold</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
                    Note: kubeReserved is not applied on worker nodes as they do not run control plane components.
                  </Typography>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{ p: 2, background: 'rgba(17, 24, 39, 0.5)', borderColor: 'rgba(0, 212, 255, 0.08)' }}
                >
                  <Typography variant="subtitle2" sx={{ color: '#94a3b8', mb: 1 }}>
                    Kernel Tuning (All Nodes)
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Parameter</TableCell>
                          <TableCell>Value</TableCell>
                          <TableCell>Purpose</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell><code>nf_conntrack_max</code></TableCell>
                          <TableCell>262144</TableCell>
                          <TableCell>Connection tracking table size for kube-proxy/services</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><code>fs.file-max</code></TableCell>
                          <TableCell>1048576</TableCell>
                          <TableCell>System-wide file descriptor limit</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><code>vm.max_map_count</code></TableCell>
                          <TableCell>262144</TableCell>
                          <TableCell>Required for Elasticsearch and JVM workloads</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><code>nofile / nproc limits</code></TableCell>
                          <TableCell>1048576</TableCell>
                          <TableCell>Per-user file descriptor and process limits</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Box>
            </Collapse>

            {!additionalK8sConfig && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Skipping additional Kubernetes configuration. You can apply these settings manually
                after provisioning. See <strong>HARDENING.md</strong> for step-by-step instructions.
              </Alert>
            )}
          </Grid>
        </Grid>
      </ReviewSection>
    </Box>
  );
};

export default Step5ReviewProvision;
