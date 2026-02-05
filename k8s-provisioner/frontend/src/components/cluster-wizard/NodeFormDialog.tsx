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
} from '@mui/material';
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
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{node ? 'Edit Node' : 'Add Node'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
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
                    helperText={errors.name?.message}
                    placeholder="e.g., control-plane-1"
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
                    helperText={errors.ip_address?.message}
                    placeholder="e.g., 192.168.1.10"
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
                    helperText={errors.ssh_port?.message}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
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
                    helperText={errors.os_type?.message || 'Select OS type'}
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
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {node ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default NodeFormDialog;
