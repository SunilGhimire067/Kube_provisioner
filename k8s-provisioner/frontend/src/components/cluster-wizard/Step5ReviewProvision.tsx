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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { hardeningSchema, HardeningFormData } from '../../utils/validation-schemas';
import { WizardData, HardeningData } from '../../types/cluster';
import { POD_SECURITY_STANDARDS } from '../../constants/cluster-config';

interface Step5ReviewProvisionProps {
  wizardData: WizardData;
  onUpdateHardening: (data: HardeningData) => void;
}

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

  // Update parent component when form data changes
  useEffect(() => {
    const subscription = watch((formData) => {
      const values = getValues();
      onUpdateHardening(values as HardeningData);
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, onUpdateHardening]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review & Provision
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Review your configuration and choose security hardening options
      </Typography>

      {/* Basic Information */}
      <Paper elevation={0} sx={{ p: 2, mt: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Basic Information
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Cluster Name
            </Typography>
            <Typography variant="body1">{basicInfo.name}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              High Availability
            </Typography>
            <Chip label={basicInfo.isHA ? 'Enabled' : 'Disabled'} size="small" color={basicInfo.isHA ? 'success' : 'default'} />
          </Grid>
          {basicInfo.description && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body1">{basicInfo.description}</Typography>
            </Grid>
          )}
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Control Plane Nodes
            </Typography>
            <Typography variant="body1">{basicInfo.controlPlaneCount}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Worker Nodes
            </Typography>
            <Typography variant="body1">{basicInfo.workerCount}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Components */}
      <Paper elevation={0} sx={{ p: 2, mt: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Components
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Kubernetes Version
            </Typography>
            <Typography variant="body1">{components.kubernetes_version}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Container Runtime
            </Typography>
            <Typography variant="body1">{components.runtime}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              CNI Plugin
            </Typography>
            <Typography variant="body1">{components.cni}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Traffic Management
            </Typography>
            <Typography variant="body1">
              {components.traffic_management_type === 'gateway-api' && 'Gateway API'}
              {components.traffic_management_type === 'ingress' && 'Traditional Ingress'}
              {components.traffic_management_type === 'none' && 'None'}
            </Typography>
          </Grid>
          {components.traffic_management_type === 'gateway-api' && components.gateway_api_controller && (
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Gateway API Controller
              </Typography>
              <Typography variant="body1">{components.gateway_api_controller}</Typography>
            </Grid>
          )}
          {components.traffic_management_type === 'ingress' && components.ingress_controller && (
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Ingress Controller
              </Typography>
              <Typography variant="body1">{components.ingress_controller}</Typography>
            </Grid>
          )}
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Monitoring
            </Typography>
            <Chip label={components.monitoring ? 'Enabled' : 'Disabled'} size="small" color={components.monitoring ? 'success' : 'default'} />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Logging
            </Typography>
            <Chip label={components.logging ? 'Enabled' : 'Disabled'} size="small" color={components.logging ? 'success' : 'default'} />
          </Grid>
        </Grid>
      </Paper>

      {/* Nodes */}
      <Paper elevation={0} sx={{ p: 2, mt: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Nodes ({nodes.length} total)
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
                <TableCell><strong>IP</strong></TableCell>
                <TableCell><strong>Port</strong></TableCell>
                <TableCell><strong>OS</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {controlPlaneNodes.map((node, idx) => (
                <TableRow key={idx}>
                  <TableCell>{node.name}</TableCell>
                  <TableCell>
                    <Chip label="Control Plane" size="small" color="primary" />
                  </TableCell>
                  <TableCell>{node.ip_address}</TableCell>
                  <TableCell>{node.ssh_port}</TableCell>
                  <TableCell>{node.os_type}</TableCell>
                </TableRow>
              ))}
              {workerNodes.map((node, idx) => (
                <TableRow key={idx}>
                  <TableCell>{node.name}</TableCell>
                  <TableCell>
                    <Chip label="Worker" size="small" color="secondary" />
                  </TableCell>
                  <TableCell>{node.ip_address}</TableCell>
                  <TableCell>{node.ssh_port}</TableCell>
                  <TableCell>{node.os_type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* SSH Configuration */}
      <Paper elevation={0} sx={{ p: 2, mt: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          SSH Configuration
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Username
            </Typography>
            <Typography variant="body1">{sshConfig.username}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Authentication Method
            </Typography>
            <Typography variant="body1">
              {sshConfig.auth_method === 'password' ? 'Password' : 'Private Key'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Security Hardening Options */}
      <Paper elevation={0} sx={{ p: 2, mt: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Security Hardening
        </Typography>
        <Divider sx={{ mb: 2 }} />
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
                      <Typography variant="body2">Apply CIS Kubernetes Benchmark</Typography>
                      <Typography variant="caption" color="text.secondary">
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
                      <Typography variant="body2">Apply CIS Linux Benchmark</Typography>
                      <Typography variant="caption" color="text.secondary">
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
      </Paper>

      {/* Additional Kubernetes Configuration */}
      <Paper elevation={0} sx={{ p: 2, mt: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Additional Kubernetes Configuration
        </Typography>
        <Divider sx={{ mb: 2 }} />
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
                      <Typography variant="body2">
                        Apply Additional Kubernetes Configuration
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
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
                  These settings protect node stability by reserving resources for system and Kubernetes
                  components.
                </Alert>

                {/* Control Plane Nodes */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'primary.50' }}>
                  <Typography variant="subtitle2" color="primary.main" gutterBottom>
                    Control Plane Nodes ({controlPlaneNodes.length} node{controlPlaneNodes.length !== 1 ? 's' : ''})
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Setting</strong></TableCell>
                          <TableCell><strong>Value</strong></TableCell>
                          <TableCell><strong>Purpose</strong></TableCell>
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

                {/* Worker Nodes */}
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'secondary.50' }}>
                  <Typography variant="subtitle2" color="secondary.main" gutterBottom>
                    Worker Nodes ({workerNodes.length} node{workerNodes.length !== 1 ? 's' : ''})
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Setting</strong></TableCell>
                          <TableCell><strong>Value</strong></TableCell>
                          <TableCell><strong>Purpose</strong></TableCell>
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
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Note: kubeReserved is not applied on worker nodes as they do not run control plane components.
                  </Typography>
                </Paper>

                {/* Kernel Tuning - All Nodes */}
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Kernel Tuning (All Nodes)
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Parameter</strong></TableCell>
                          <TableCell><strong>Value</strong></TableCell>
                          <TableCell><strong>Purpose</strong></TableCell>
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
      </Paper>
    </Box>
  );
};

export default Step5ReviewProvision;
