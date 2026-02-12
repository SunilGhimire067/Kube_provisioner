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
        onClick={handleTestSSH}
        disabled={testing || nodes.length === 0}
        startIcon={testing ? <CircularProgress size={20} sx={{ color: '#00d4ff' }} /> : <Cable />}
        fullWidth
        sx={{
          mb: 2,
          py: 1.5,
          borderColor: 'rgba(0, 212, 255, 0.3)',
          color: '#00d4ff',
          fontWeight: 600,
          fontSize: '0.9rem',
          letterSpacing: '0.5px',
          '&:hover': {
            borderColor: '#00d4ff',
            background: 'rgba(0, 212, 255, 0.08)',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.15)',
          },
          '&.Mui-disabled': {
            borderColor: 'rgba(100, 116, 139, 0.2)',
            color: '#475569',
          },
        }}
      >
        {testing ? 'Testing SSH Connection...' : 'Test SSH Connection'}
      </Button>

      {testResults && (
        <Alert
          severity={testResults.success ? 'success' : 'error'}
          sx={{
            mt: 2,
            background: testResults.success
              ? 'rgba(0, 230, 118, 0.08)'
              : 'rgba(255, 23, 68, 0.08)',
            border: `1px solid ${testResults.success ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 23, 68, 0.2)'}`,
            borderRadius: '8px',
            '& .MuiAlert-icon': {
              color: testResults.success ? '#00e676' : '#ff1744',
            },
          }}
          icon={testResults.success ? <CheckCircle /> : <Cancel />}
        >
          <Typography variant="body2" fontWeight="bold" gutterBottom sx={{ color: '#e2e8f0' }}>
            {testResults.message || (testResults.success ? 'All connections successful' : 'Connection test failed')}
          </Typography>

          {testResults.results && testResults.results.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {testResults.results.map((result, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Chip
                    label={result.node}
                    size="small"
                    icon={result.success ? <CheckCircle /> : <Cancel />}
                    sx={{
                      bgcolor: result.success ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 23, 68, 0.1)',
                      color: result.success ? '#00e676' : '#ff616f',
                      border: `1px solid ${result.success ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 23, 68, 0.2)'}`,
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      '& .MuiChip-icon': {
                        color: result.success ? '#00e676' : '#ff616f',
                        fontSize: 16,
                      },
                    }}
                  />
                  {result.error && (
                    <Typography
                      variant="caption"
                      sx={{ color: '#ff616f', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}
                    >
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
