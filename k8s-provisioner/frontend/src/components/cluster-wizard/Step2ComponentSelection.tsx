import React, { useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  Paper,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert,
} from '@mui/material';
import { Extension, NetworkCheck, Traffic, Tune } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { componentsSchema, ComponentsFormData } from '../../utils/validation-schemas';
import { ComponentsData } from '../../types/cluster';
import {
  K8S_VERSIONS,
  CNI_OPTIONS,
  TRAFFIC_MANAGEMENT_TYPE,
  GATEWAY_API_CONTROLLERS,
  INGRESS_OPTIONS,
  RUNTIME_OPTIONS,
} from '../../constants/cluster-config';

interface Step2ComponentSelectionProps {
  data: ComponentsData;
  onUpdate: (data: ComponentsData) => void;
}

const SectionDivider = () => (
  <Grid item xs={12}><Divider sx={{ borderColor: 'rgba(0, 212, 255, 0.06)' }} /></Grid>
);

const Step2ComponentSelection: React.FC<Step2ComponentSelectionProps> = ({ data, onUpdate }) => {
  const {
    control,
    watch,
    formState: { errors },
    getValues,
  } = useForm<ComponentsFormData>({
    resolver: zodResolver(componentsSchema),
    defaultValues: data,
    mode: 'onChange',
  });

  const trafficManagementType = watch('traffic_management_type');
  const gatewayController = watch('gateway_api_controller');
  const cni = watch('cni');

  useEffect(() => {
    const subscription = watch((formData) => {
      const values = getValues();
      onUpdate(values as ComponentsData);
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, onUpdate]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Extension sx={{ color: '#7c4dff', fontSize: 22 }} />
        <Typography variant="h6" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
          Component Selection
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
        Choose Kubernetes version and cluster components
      </Typography>

      <Paper
        elevation={0}
        sx={{ p: 3, background: 'rgba(17, 24, 39, 0.5)', border: '1px solid rgba(0, 212, 255, 0.08)' }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Controller
              name="kubernetes_version"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Kubernetes Version"
                  fullWidth
                  required
                  error={!!errors.kubernetes_version}
                  helperText={errors.kubernetes_version?.message || 'Select the Kubernetes version to install'}
                >
                  {K8S_VERSIONS.map((version) => (
                    <MenuItem key={version} value={version}>{version}</MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          <SectionDivider />

          <Grid item xs={12}>
            <Controller
              name="runtime"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Container Runtime"
                  fullWidth
                  required
                  error={!!errors.runtime}
                  helperText={errors.runtime?.message || 'Container runtime for running pods'}
                >
                  {RUNTIME_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          <SectionDivider />

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <NetworkCheck sx={{ color: '#00d4ff', fontSize: 18 }} />
              <Typography variant="subtitle2" sx={{ color: '#94a3b8' }}>
                Network Configuration
              </Typography>
            </Box>
            <Controller
              name="cni"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="CNI Plugin"
                  fullWidth
                  required
                  error={!!errors.cni}
                  helperText={errors.cni?.message || 'Container Network Interface for pod networking'}
                >
                  {CNI_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          <SectionDivider />

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Traffic sx={{ color: '#7c4dff', fontSize: 18 }} />
              <Typography variant="subtitle2" sx={{ color: '#94a3b8' }}>
                Traffic Management
              </Typography>
            </Box>
            <Controller
              name="traffic_management_type"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Traffic Management Type"
                  fullWidth
                  required
                  error={!!errors.traffic_management_type}
                  helperText={
                    errors.traffic_management_type?.message ||
                    'Gateway API is the modern, standardized approach (recommended)'
                  }
                >
                  {TRAFFIC_MANAGEMENT_TYPE.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label} - {option.description}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          {trafficManagementType === 'gateway-api' && (
            <>
              <Grid item xs={12}>
                <Controller
                  name="gateway_api_controller"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Gateway API Controller"
                      fullWidth
                      required
                      error={!!errors.gateway_api_controller}
                      helperText={errors.gateway_api_controller?.message || 'Select the Gateway API implementation'}
                    >
                      {GATEWAY_API_CONTROLLERS.map((option) => (
                        <MenuItem
                          key={option.value}
                          value={option.value}
                          disabled={option.value === 'cilium' && cni !== 'cilium'}
                        >
                          {option.label} - {option.description}
                          {option.value === 'cilium' && cni !== 'cilium' && ' (requires Cilium CNI)'}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="success">
                  Gateway API is the successor to Ingress and provides more flexibility and standardization for
                  traffic management. It's the recommended choice for new clusters.
                </Alert>
              </Grid>
            </>
          )}

          {trafficManagementType === 'ingress' && (
            <>
              <Grid item xs={12}>
                <Controller
                  name="ingress_controller"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Ingress Controller"
                      fullWidth
                      required
                      error={!!errors.ingress_controller}
                      helperText={errors.ingress_controller?.message || 'Select the ingress controller'}
                    >
                      {INGRESS_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label} - {option.description}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="warning">
                  <strong>Note:</strong> Community-maintained NGINX Ingress Controller is heading toward
                  end-of-maintenance by March 2026. Consider using Gateway API for new clusters.
                </Alert>
              </Grid>
            </>
          )}

          {trafficManagementType === 'none' && (
            <Grid item xs={12}>
              <Alert severity="info">
                No traffic management will be installed. You can manually install an ingress controller or Gateway
                API implementation later.
              </Alert>
            </Grid>
          )}

          <SectionDivider />

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Tune sx={{ color: '#ff9100', fontSize: 18 }} />
              <Typography variant="subtitle2" sx={{ color: '#94a3b8' }}>
                Optional Features
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Controller
                name="monitoring"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ color: '#e2e8f0' }}>Enable Monitoring</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Install Prometheus and Grafana for cluster monitoring
                        </Typography>
                      </Box>
                    }
                  />
                )}
              />
              <Controller
                name="logging"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ color: '#e2e8f0' }}>Enable Logging</Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Install EFK/Loki stack for centralized logging
                        </Typography>
                      </Box>
                    }
                  />
                )}
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                background: 'rgba(0, 212, 255, 0.04)',
                border: '1px solid rgba(0, 212, 255, 0.1)',
                borderRadius: '8px',
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: '#94a3b8', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem' }}
              >
                <Box component="span" sx={{ color: '#00d4ff', fontWeight: 600 }}>Config:</Box>{' '}
                Kubernetes {watch('kubernetes_version')} with {watch('cni')} CNI
                {trafficManagementType === 'gateway-api' && ` + ${gatewayController} Gateway API`}
                {trafficManagementType === 'ingress' && ` + ${watch('ingress_controller')} ingress`}
                {trafficManagementType === 'none' && ' (no traffic management)'}
                {watch('monitoring') && ' + Monitoring'}
                {watch('logging') && ' + Logging'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Step2ComponentSelection;
