import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import { Add, Edit, Delete, Dns } from '@mui/icons-material';
import { NodeData, BasicInfoData } from '../../types/cluster';
import NodeFormDialog from './NodeFormDialog';

interface Step3NodeConfigurationProps {
  nodes: NodeData[];
  basicInfo: BasicInfoData;
  onUpdate: (nodes: NodeData[]) => void;
}

const Step3NodeConfiguration: React.FC<Step3NodeConfigurationProps> = ({ nodes, basicInfo, onUpdate }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<NodeData | undefined>(undefined);
  const [validationError, setValidationError] = useState<string>('');

  const controlPlaneNodes = nodes.filter((n) => n.role === 'control-plane');
  const workerNodes = nodes.filter((n) => n.role === 'worker');
  const existingIPs = nodes.map((n) => n.ip_address);
  const existingNames = nodes.map((n) => n.name);

  useEffect(() => {
    const cpCount = controlPlaneNodes.length;
    const wCount = workerNodes.length;
    if (nodes.length === 0) {
      setValidationError('Please add at least one node');
    } else if (cpCount === 0) {
      setValidationError('At least one control plane node is required');
    } else if (basicInfo.isHA && cpCount < 3) {
      setValidationError('HA mode requires at least 3 control plane nodes');
    } else if (basicInfo.isHA && cpCount % 2 === 0) {
      setValidationError('HA mode requires an odd number of control plane nodes');
    } else if (cpCount !== basicInfo.controlPlaneCount) {
      setValidationError(`Expected ${basicInfo.controlPlaneCount} control plane node(s), but ${cpCount} configured`);
    } else if (wCount !== basicInfo.workerCount) {
      setValidationError(`Expected ${basicInfo.workerCount} worker node(s), but ${wCount} configured`);
    } else {
      setValidationError('');
    }
  }, [nodes, basicInfo, controlPlaneNodes.length, workerNodes.length]);

  const handleAddNode = () => { setEditingNode(undefined); setDialogOpen(true); };
  const handleEditNode = (node: NodeData) => { setEditingNode(node); setDialogOpen(true); };
  const handleDeleteNode = (node: NodeData) => {
    onUpdate(nodes.filter((n) => n.ip_address !== node.ip_address));
  };
  const handleSaveNode = (node: NodeData) => {
    const updatedNodes = editingNode
      ? nodes.map((n) => (n.ip_address === editingNode.ip_address ? node : n))
      : [...nodes, node];
    onUpdate(updatedNodes);
    setDialogOpen(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Dns sx={{ color: '#00e676', fontSize: 22 }} />
        <Typography variant="h6" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
          Node Configuration
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
        Add and configure nodes for your cluster
      </Typography>

      {validationError && <Alert severity="error" sx={{ mb: 2 }}>{validationError}</Alert>}

      <Paper
        elevation={0}
        sx={{
          p: 2, mb: 2,
          background: 'rgba(0, 212, 255, 0.04)',
          border: '1px solid rgba(0, 212, 255, 0.1)',
          borderRadius: '8px',
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: '#94a3b8', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem' }}
        >
          <Box component="span" sx={{ color: '#00d4ff', fontWeight: 600 }}>Required:</Box>{' '}
          {basicInfo.controlPlaneCount} control plane + {basicInfo.workerCount} worker
          {'  |  '}
          <Box component="span" sx={{ color: '#7c4dff', fontWeight: 600 }}>Configured:</Box>{' '}
          {controlPlaneNodes.length} control plane + {workerNodes.length} worker = {nodes.length} total
        </Typography>
      </Paper>

      {nodes.length > 0 ? (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: '1px solid rgba(0, 212, 255, 0.08)', background: 'rgba(17, 24, 39, 0.5)' }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>SSH Port</TableCell>
                <TableCell>OS</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nodes.map((node, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem' }}>
                    {node.name}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={node.role}
                      size="small"
                      sx={{
                        bgcolor: node.role === 'control-plane' ? 'rgba(0, 212, 255, 0.1)' : 'rgba(124, 77, 255, 0.1)',
                        color: node.role === 'control-plane' ? '#00d4ff' : '#b47cff',
                        border: `1px solid ${node.role === 'control-plane' ? 'rgba(0, 212, 255, 0.2)' : 'rgba(124, 77, 255, 0.2)'}`,
                        fontWeight: 600, fontSize: '0.7rem',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem', color: '#00d4ff' }}>
                    {node.ip_address}
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem' }}>
                    {node.ssh_port}
                  </TableCell>
                  <TableCell>{node.os_type}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEditNode(node)} sx={{ color: '#00d4ff' }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteNode(node)} sx={{ color: '#ff616f' }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper
          elevation={0}
          sx={{ p: 4, textAlign: 'center', border: '1px dashed rgba(0, 212, 255, 0.15)', background: 'rgba(17, 24, 39, 0.3)' }}
        >
          <Dns sx={{ fontSize: 40, color: '#475569', mb: 1 }} />
          <Typography variant="body1" sx={{ color: '#64748b' }} gutterBottom>No nodes configured yet</Typography>
          <Typography variant="body2" sx={{ color: '#475569' }}>Click the button below to add your first node</Typography>
        </Paper>
      )}

      <Box sx={{ mt: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={handleAddNode} sx={{ px: 3 }}>
          Add Node
        </Button>
      </Box>

      <NodeFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveNode}
        node={editingNode}
        existingIPs={existingIPs}
        existingNames={existingNames}
      />
    </Box>
  );
};

export default Step3NodeConfiguration;
