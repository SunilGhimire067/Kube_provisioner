import React, { useState } from 'react';
import { Button, CircularProgress, Box, Alert, Typography, Chip } from '@mui/material';
import { CheckCircle, Cancel, Cable } from '@mui/icons-material';
import { NodeData, SSHConfigData, SSHTestResponse } from '../../types/cluster';
import { clustersAPI } from '../../services/api';
import { toast } from 'react-toastify';

interface SSHTestButtonProps {
  nodes: NodeData[];
  sshConfig: SSHConfigData;
  onTestComplete?: (success: boolean) => void;
}

const SSHTestButton: React.FC<SSHTestButtonProps> = ({ nodes, sshConfig, onTestComplete }) => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<SSHTestResponse | null>(null);

  const handleTestSSH = async () => {
    if (nodes.length === 0) {
      toast.error('Please add at least one node before testing SSH');
      return;
    }

    setTesting(true);
    setTestResults(null);

    try {
      const response = await clustersAPI.testSSH({
        nodes,
        ssh_config: sshConfig,
      });

      const data: SSHTestResponse = response.data;
      setTestResults(data);

      if (data.success) {
        toast.success('SSH connection test passed for all nodes!');
        onTestComplete?.(true);
      } else {
        toast.error(data.message || 'SSH connection test failed for some nodes');
        onTestComplete?.(false);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to test SSH connection';
      toast.error(errorMessage);
      setTestResults({
        success: false,
        message: errorMessage,
      });
      onTestComplete?.(false);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Box>
      <Button
        variant="outlined"
        color="primary"
        onClick={handleTestSSH}
        disabled={testing || nodes.length === 0}
        startIcon={testing ? <CircularProgress size={20} /> : <Cable />}
        fullWidth
        sx={{ mb: 2 }}
      >
        {testing ? 'Testing SSH Connection...' : 'Test SSH Connection'}
      </Button>

      {testResults && (
        <Alert
          severity={testResults.success ? 'success' : 'error'}
          sx={{ mt: 2 }}
          icon={testResults.success ? <CheckCircle /> : <Cancel />}
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            {testResults.message || (testResults.success ? 'All connections successful' : 'Connection test failed')}
          </Typography>

          {testResults.results && testResults.results.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {testResults.results.map((result, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Chip
                    label={result.node}
                    size="small"
                    color={result.success ? 'success' : 'error'}
                    icon={result.success ? <CheckCircle /> : <Cancel />}
                  />
                  {result.error && (
                    <Typography variant="caption" color="error">
                      {result.error}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Alert>
      )}
    </Box>
  );
};

export default SSHTestButton;
