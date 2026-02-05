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
import { Add, Edit, Delete } from '@mui/icons-material';
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

  // Validate node configuration against topology
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

  const handleAddNode = () => {
    setEditingNode(undefined);
    setDialogOpen(true);
  };

  const handleEditNode = (node: NodeData) => {
    setEditingNode(node);
    setDialogOpen(true);
  };

  const handleDeleteNode = (node: NodeData) => {
    const updatedNodes = nodes.filter((n) => n.ip_address !== node.ip_address);
    onUpdate(updatedNodes);
  };

  const handleSaveNode = (node: NodeData) => {
    let updatedNodes: NodeData[];

    if (editingNode) {
      // Update existing node
      updatedNodes = nodes.map((n) => (n.ip_address === editingNode.ip_address ? node : n));
    } else {
      // Add new node
      updatedNodes = [...nodes, node];
    }

    onUpdate(updatedNodes);
    setDialogOpen(false);
  };

  const getRoleColor = (role: string) => {
    return role === 'control-plane' ? 'primary' : 'secondary';
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Node Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Add and configure nodes for your cluster
      </Typography>

      {validationError && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {validationError}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 2, mt: 2, mb: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
        <Typography variant="body2">
          <strong>Required Configuration:</strong> {basicInfo.controlPlaneCount} control plane node(s) + {basicInfo.workerCount} worker node(s)
        </Typography>
        <Typography variant="body2">
          <strong>Current Configuration:</strong> {controlPlaneNodes.length} control plane + {workerNodes.length} worker = {nodes.length} total nodes
        </Typography>
      </Paper>

      {/* Nodes Table */}
      {nodes.length > 0 ? (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
                <TableCell><strong>IP Address</strong></TableCell>
                <TableCell><strong>SSH Port</strong></TableCell>
                <TableCell><strong>OS</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nodes.map((node, index) => (
                <TableRow key={index} hover>
                  <TableCell>{node.name}</TableCell>
                  <TableCell>
                    <Chip label={node.role} size="small" color={getRoleColor(node.role)} />
                  </TableCell>
                  <TableCell>{node.ip_address}</TableCell>
                  <TableCell>{node.ssh_port}</TableCell>
                  <TableCell>{node.os_type}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" onClick={() => handleEditNode(node)} title="Edit node">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteNode(node)}
                      title="Delete node"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider' }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No nodes configured yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click the button below to add your first node
          </Typography>
        </Paper>
      )}

      {/* Add Node Button */}
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={handleAddNode}>
          Add Node
        </Button>
      </Box>

      {/* Node Form Dialog */}
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
