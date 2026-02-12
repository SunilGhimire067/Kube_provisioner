import React, { useEffect } from 'react';
import {
  Box,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  Grid,
  Paper,
  Alert,
  Chip,
} from '@mui/material';
import { Settings, Hub } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { basicInfoSchema, BasicInfoFormData } from '../../utils/validation-schemas';
import { BasicInfoData } from '../../types/cluster';
import { DEFAULT_CONTROL_PLANE_COUNT_HA, DEFAULT_WORKER_COUNT } from '../../constants/cluster-config';

interface Step1BasicInfoProps {
  data: BasicInfoData;
  onUpdate: (data: BasicInfoData) => void;
}

const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({ data, onUpdate }) => {
  const {
    control,
    watch,
    formState: { errors },
    getValues,
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: data,
    mode: 'onChange',
  });

  const isHA = watch('isHA');

  useEffect(() => {
    const subscription = watch((formData) => {
      const values = getValues();
      onUpdate(values as BasicInfoData);
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, onUpdate]);

  useEffect(() => {
    const currentValues = getValues();
    if (isHA && currentValues.controlPlaneCount === 1) {
      onUpdate({ ...currentValues, controlPlaneCount: DEFAULT_CONTROL_PLANE_COUNT_HA });
    } else if (!isHA && currentValues.controlPlaneCount > 1) {
      onUpdate({ ...currentValues, controlPlaneCount: 1 });
    }
  }, [isHA, getValues, onUpdate]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Settings sx={{ color: '#00d4ff', fontSize: 22 }} />
        <Typography variant="h6" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
          Basic Information
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
        Configure basic cluster settings and topology
      </Typography>

      <Paper
        elevation={0}
        sx={{ p: 3, background: 'rgba(17, 24, 39, 0.5)', border: '1px solid rgba(0, 212, 255, 0.08)' }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Cluster Name"
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name?.message || 'Lowercase alphanumeric characters and hyphens only'}
                  placeholder="e.g., production-cluster-01"
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  error={!!errors.description}
                  helperText={errors.description?.message || 'Optional description of the cluster'}
                  placeholder="e.g., Production Kubernetes cluster for web applications"
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="isHA"
              control={control}
              render={({ field }) => (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    background: isHA ? 'rgba(0, 212, 255, 0.05)' : 'rgba(17, 24, 39, 0.3)',
                    border: `1px solid ${isHA ? 'rgba(0, 212, 255, 0.2)' : 'rgba(0, 212, 255, 0.06)'}`,
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label={
                      <Box sx={{ ml: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ color: '#e2e8f0', fontWeight: 500 }}>
                            High Availability (HA) Mode
                          </Typography>
                          {isHA && (
                            <Chip
                              label="ENABLED"
                              size="small"
                              sx={{
                                bgcolor: 'rgba(0, 230, 118, 0.1)',
                                color: '#00e676',
                                border: '1px solid rgba(0, 230, 118, 0.2)',
                                fontWeight: 700,
                                fontSize: '0.6rem',
                                height: 20,
                              }}
                            />
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Enable HA for production workloads with multiple control plane nodes
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>
              )}
            />
          </Grid>

          {isHA && (
            <Grid item xs={12}>
              <Alert severity="info">
                HA mode requires at least 3 control plane nodes (must be an odd number) for proper quorum management.
              </Alert>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <Controller
              name="controlPlaneCount"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Control Plane Nodes"
                  type="number"
                  fullWidth
                  required
                  disabled={!isHA}
                  error={!!errors.controlPlaneCount}
                  helperText={
                    errors.controlPlaneCount?.message ||
                    (isHA ? 'Number of control plane nodes (odd number, min 3)' : 'Single control plane node')
                  }
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                  InputProps={{ inputProps: { min: isHA ? 3 : 1, step: isHA ? 2 : 1 } }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="workerCount"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Worker Nodes"
                  type="number"
                  fullWidth
                  required
                  error={!!errors.workerCount}
                  helperText={errors.workerCount?.message || 'Number of worker nodes for running workloads'}
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  InputProps={{ inputProps: { min: 0, step: 1 } }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                background: 'rgba(0, 212, 255, 0.04)',
                border: '1px solid rgba(0, 212, 255, 0.1)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Hub sx={{ color: '#00d4ff', fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{ color: '#94a3b8', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem' }}
              >
                Total Nodes:{' '}
                <Box component="span" sx={{ color: '#00d4ff', fontWeight: 600 }}>
                  {watch('controlPlaneCount') + watch('workerCount')}
                </Box>
                {' '}({watch('controlPlaneCount')} control plane + {watch('workerCount')} worker)
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Step1BasicInfo;
