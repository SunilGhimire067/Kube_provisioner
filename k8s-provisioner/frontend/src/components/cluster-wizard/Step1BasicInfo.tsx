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
} from '@mui/material';
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

  // Update parent component when form data changes
  useEffect(() => {
    const subscription = watch((formData) => {
      const values = getValues();
      onUpdate(values as BasicInfoData);
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, onUpdate]);

  // Automatically adjust control plane count when HA is toggled
  useEffect(() => {
    const currentValues = getValues();
    if (isHA && currentValues.controlPlaneCount === 1) {
      onUpdate({
        ...currentValues,
        controlPlaneCount: DEFAULT_CONTROL_PLANE_COUNT_HA,
      });
    } else if (!isHA && currentValues.controlPlaneCount > 1) {
      onUpdate({
        ...currentValues,
        controlPlaneCount: 1,
      });
    }
  }, [isHA, getValues, onUpdate]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Basic Information
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Configure basic cluster settings and topology
      </Typography>

      <Paper elevation={0} sx={{ p: 3, mt: 2, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={3}>
          {/* Cluster Name */}
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

          {/* Description */}
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

          {/* HA Toggle */}
          <Grid item xs={12}>
            <Controller
              name="isHA"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} />}
                  label={
                    <Box>
                      <Typography variant="body1">High Availability (HA) Mode</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Enable HA for production workloads with multiple control plane nodes
                      </Typography>
                    </Box>
                  }
                />
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

          {/* Control Plane Count */}
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
                  InputProps={{
                    inputProps: { min: isHA ? 3 : 1, step: isHA ? 2 : 1 },
                  }}
                />
              )}
            />
          </Grid>

          {/* Worker Count */}
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
                  InputProps={{
                    inputProps: { min: 0, step: 1 },
                  }}
                />
              )}
            />
          </Grid>

          {/* Summary */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary">
                Total Nodes:{' '}
                <strong>
                  {watch('controlPlaneCount') + watch('workerCount')} ({watch('controlPlaneCount')} control plane + {watch('workerCount')} worker)
                </strong>
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Step1BasicInfo;
