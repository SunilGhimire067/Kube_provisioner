import React, { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Alert,
} from '@mui/material';
import { VpnKey } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sshConfigSchema, SSHConfigFormData } from '../../utils/validation-schemas';
import { SSHConfigData, NodeData } from '../../types/cluster';
import SSHTestButton from './SSHTestButton';

interface Step4SSHAuthenticationProps {
  data: SSHConfigData;
  nodes: NodeData[];
  onUpdate: (data: SSHConfigData) => void;
}

const Step4SSHAuthentication: React.FC<Step4SSHAuthenticationProps> = ({ data, nodes, onUpdate }) => {
  const [sshTestPassed, setSshTestPassed] = useState<boolean | null>(null);

  const {
    control,
    watch,
    formState: { errors },
    getValues,
  } = useForm<SSHConfigFormData>({
    resolver: zodResolver(sshConfigSchema),
    defaultValues: data,
    mode: 'onChange',
  });

  const authMethod = watch('auth_method');

  useEffect(() => {
    const subscription = watch((formData) => {
      const values = getValues();
      onUpdate(values as SSHConfigData);
    });
    return () => subscription.unsubscribe();
  }, [watch, getValues, onUpdate]);

  const handleTestComplete = (success: boolean) => {
    setSshTestPassed(success);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <VpnKey sx={{ color: '#ff9100', fontSize: 22 }} />
        <Typography variant="h6" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
          SSH Authentication
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
        Configure SSH credentials to access your nodes
      </Typography>

      <Paper
        elevation={0}
        sx={{ p: 3, background: 'rgba(17, 24, 39, 0.5)', border: '1px solid rgba(0, 212, 255, 0.08)' }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="SSH Username"
                  fullWidth
                  required
                  error={!!errors.username}
                  helperText={errors.username?.message || 'Username for SSH access (e.g., root, ubuntu)'}
                  placeholder="root"
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ color: '#94a3b8', '&.Mui-focused': { color: '#00d4ff' } }}>
                Authentication Method
              </FormLabel>
              <Controller
                name="auth_method"
                control={control}
                render={({ field }) => (
                  <RadioGroup {...field} row>
                    <FormControlLabel value="password" control={<Radio />} label="Password" />
                    <FormControlLabel value="private_key" control={<Radio />} label="Private Key" />
                  </RadioGroup>
                )}
              />
            </FormControl>
          </Grid>

          {authMethod === 'password' && (
            <Grid item xs={12}>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Password"
                    type="password"
                    fullWidth
                    required
                    error={!!errors.password}
                    helperText={errors.password?.message || 'SSH password for authentication'}
                    placeholder="Enter SSH password"
                  />
                )}
              />
            </Grid>
          )}

          {authMethod === 'private_key' && (
            <>
              <Grid item xs={12}>
                <Controller
                  name="private_key"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Private Key"
                      fullWidth
                      required
                      multiline
                      rows={8}
                      error={!!errors.private_key}
                      helperText={errors.private_key?.message || 'Paste your SSH private key (OpenSSH format)'}
                      placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                      InputProps={{
                        sx: { fontFamily: '"JetBrains Mono", monospace', fontSize: '0.8rem' },
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="passphrase"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Key Passphrase (Optional)"
                      type="password"
                      fullWidth
                      error={!!errors.passphrase}
                      helperText={errors.passphrase?.message || 'Only required if your private key is encrypted'}
                      placeholder="Enter passphrase if key is encrypted"
                    />
                  )}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Test SSH connection before proceeding to ensure credentials are correct and nodes are accessible.
            </Alert>
            <SSHTestButton nodes={nodes} sshConfig={getValues()} onTestComplete={handleTestComplete} />
          </Grid>

          {sshTestPassed !== null && (
            <Grid item xs={12}>
              {sshTestPassed ? (
                <Alert severity="success">SSH connection test passed! You can proceed to the next step.</Alert>
              ) : (
                <Alert severity="warning">
                  SSH connection test failed. Please verify your credentials and node configuration.
                </Alert>
              )}
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default Step4SSHAuthentication;
