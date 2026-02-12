import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  Typography,
} from '@mui/material';
import { Dns, Save, Close } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { nodeSchema, NodeFormData } from '../../utils/validation-schemas';
import { NodeData } from '../../types/cluster';
import { OS_OPTIONS, NODE_ROLES, DEFAULT_SSH_PORT } from '../../constants/cluster-config';

interface NodeFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (node: NodeData) => void;
  node?: NodeData;
  existingIPs: string[];
  existingNames: string[];
}

const NodeFormDialog: React.FC<NodeFormDialogProps> = ({
  open,
  onClose,
  onSave,
  node,
  existingIPs,
  existingNames,
}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NodeFormData>({
    resolver: zodResolver(nodeSchema),
    defaultValues: node || {
      name: '',
      role: 'worker',
      ip_address: '',
      ssh_port: DEFAULT_SSH_PORT,
      os_type: 'ubuntu22',
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        node || {
          name: '',
          role: 'worker',
          ip_address: '',
          ssh_port: DEFAULT_SSH_PORT,
          os_type: 'ubuntu22',
        }
      );
    }
  }, [open, node, reset]);

  const onSubmit = (data: NodeFormData) => {
    // Check for duplicates (excluding current node if editing)
    const ipExists = existingIPs.includes(data.ip_address) && data.ip_address !== node?.ip_address;
    const nameExists = existingNames.includes(data.name) && data.name !== node?.name;

    if (ipExists) {
      alert('IP address already exists');
      return;
    }

    if (nameExists) {
      alert('Node name already exists');
      return;
    }

    onSave(data);
    handleClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.98) 0%, rgba(10, 14, 26, 0.98) 100%)',
          border: '1px solid rgba(0, 212, 255, 0.15)',
          borderRadius: '12px',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #00d4ff, #7c4dff, transparent)',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pb: 1,
          borderBottom: '1px solid rgba(0, 212, 255, 0.08)',
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(124, 77, 255, 0.15))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Dns sx={{ color: '#00d4ff', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ color: '#e2e8f0', fontWeight: 600, fontSize: '1.1rem' }}>
            {node ? 'Edit Node' : 'Add Node'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            {node ? 'Update node configuration' : 'Configure a new cluster node'}
          </Typography>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Node Name"
                    fullWidth
                    margin="normal"
                    error={!!errors.name}
                    helperText={errors.name?.message || 'Unique identifier for this node'}
                    placeholder="e.g., control-plane-1"
                    InputProps={{
                      sx: { fontFamily: '"JetBrains Mono", monospace', fontSize: '0.9rem' },
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Role"
                    fullWidth
                    margin="normal"
                    error={!!errors.role}
                    helperText={errors.role?.message || 'Select node role'}
                  >
                    {NODE_ROLES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12} sm={8}>
              <Controller
                name="ip_address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="IP Address"
                    fullWidth
                    margin="normal"
                    error={!!errors.ip_address}
                    helperText={errors.ip_address?.message || 'IPv4 address of the node'}
                    placeholder="e.g., 192.168.1.10"
                    InputProps={{
                      sx: { fontFamily: '"JetBrains Mono", monospace', fontSize: '0.9rem', color: '#00d4ff' },
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="ssh_port"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="SSH Port"
                    type="number"
                    fullWidth
                    margin="normal"
                    error={!!errors.ssh_port}
                    helperText={errors.ssh_port?.message || 'Default: 22'}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    InputProps={{
                      sx: { fontFamily: '"JetBrains Mono", monospace', fontSize: '0.9rem' },
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="os_type"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Operating System"
                    fullWidth
                    margin="normal"
                    error={!!errors.os_type}
                    helperText={errors.os_type?.message || 'Select the OS running on this node'}
                  >
                    {OS_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label} - {option.description}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid rgba(0, 212, 255, 0.08)',
            gap: 1,
          }}
        >
          <Button
            onClick={handleClose}
            startIcon={<Close />}
            sx={{
              color: '#94a3b8',
              borderColor: 'rgba(148, 163, 184, 0.3)',
              '&:hover': { borderColor: '#ff616f', color: '#ff616f', background: 'rgba(255, 97, 111, 0.08)' },
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<Save />}
            sx={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #7c4dff 100%)',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, #00bce0 0%, #6a3de8 100%)',
                boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
              },
            }}
          >
            {node ? 'Save Changes' : 'Add Node'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default NodeFormDialog;
