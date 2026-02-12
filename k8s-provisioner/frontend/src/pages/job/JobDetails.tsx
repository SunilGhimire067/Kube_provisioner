import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  WorkHistory,
  CheckCircle,
  Terminal,
  Schedule,
  Cloud,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

const DEMO_JOB = {
  id: 'job-002',
  cluster: 'staging-cluster',
  type: 'provision',
  status: 'running',
  progress: 67,
  started: '2024-03-10T14:22:00Z',
  steps: [
    { name: 'Validate Configuration', status: 'completed', duration: '2s' },
    { name: 'Test SSH Connectivity', status: 'completed', duration: '8s' },
    { name: 'Install Prerequisites', status: 'completed', duration: '1m 45s' },
    { name: 'Initialize Control Plane', status: 'completed', duration: '2m 12s' },
    { name: 'Configure CNI Plugin', status: 'running', duration: '1m 05s' },
    { name: 'Join Worker Nodes', status: 'pending', duration: '—' },
    { name: 'Install Add-ons', status: 'pending', duration: '—' },
    { name: 'Verify Cluster Health', status: 'pending', duration: '—' },
  ],
  logs: [
    '[14:22:01] Starting cluster provisioning for staging-cluster...',
    '[14:22:03] Validating cluster configuration... OK',
    '[14:22:11] Testing SSH connectivity to 3 nodes... OK',
    '[14:22:11] All nodes accessible via SSH',
    '[14:23:56] Installing prerequisites on all nodes...',
    '[14:23:56] >> apt-get update && apt-get install -y containerd',
    '[14:26:08] Prerequisites installed successfully',
    '[14:26:08] Initializing control plane on cp-1 (10.0.1.10)...',
    '[14:28:20] Control plane initialized. kubeadm join token generated.',
    '[14:28:20] Deploying Calico CNI...',
    '[14:29:25] Waiting for CNI pods to become ready...',
  ],
};

const stepStatusStyles: Record<string, { color: string; bg: string }> = {
  completed: { color: '#00e676', bg: 'rgba(0, 230, 118, 0.1)' },
  running: { color: '#00d4ff', bg: 'rgba(0, 212, 255, 0.1)' },
  pending: { color: '#475569', bg: 'rgba(100, 116, 139, 0.05)' },
  failed: { color: '#ff1744', bg: 'rgba(255, 23, 68, 0.1)' },
};

export default function JobDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/jobs')}
        sx={{ color: '#64748b', mb: 2, ml: -1, '&:hover': { color: '#00d4ff' } }}
      >
        Back to Jobs
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(124, 77, 255, 0.15), rgba(0, 212, 255, 0.15))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <WorkHistory sx={{ color: '#7c4dff', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#e2e8f0', fontFamily: '"JetBrains Mono", monospace' }}>
              {id || DEMO_JOB.id}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
              <Chip
                label={DEMO_JOB.type}
                size="small"
                sx={{
                  bgcolor: 'rgba(0, 212, 255, 0.1)',
                  color: '#00d4ff',
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                }}
              />
              <Chip
                label={DEMO_JOB.status}
                size="small"
                sx={{
                  bgcolor: 'rgba(0, 212, 255, 0.1)',
                  color: '#00d4ff',
                  border: '1px solid rgba(0, 212, 255, 0.3)',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Progress */}
      <Paper
        elevation={0}
        sx={{ p: 3, mb: 3, background: 'rgba(17, 24, 39, 0.5)', border: '1px solid rgba(0, 212, 255, 0.08)', borderRadius: '12px' }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: '#94a3b8' }}>Overall Progress</Typography>
          <Typography variant="h5" sx={{ color: '#00d4ff', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>
            {DEMO_JOB.progress}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={DEMO_JOB.progress}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'rgba(0, 212, 255, 0.08)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: 'linear-gradient(90deg, #00d4ff, #7c4dff)',
            },
          }}
        />
        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Cloud sx={{ color: '#94a3b8', fontSize: 16 }} />
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>{DEMO_JOB.cluster}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Schedule sx={{ color: '#94a3b8', fontSize: 16 }} />
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Started {new Date(DEMO_JOB.started).toLocaleString()}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Steps */}
        <Grid item xs={12} md={5}>
          <Paper
            elevation={0}
            sx={{ p: 3, background: 'rgba(17, 24, 39, 0.5)', border: '1px solid rgba(0, 212, 255, 0.08)', borderRadius: '12px', height: '100%' }}
          >
            <Typography variant="subtitle2" sx={{ color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem', mb: 2 }}>
              Provisioning Steps
            </Typography>
            {DEMO_JOB.steps.map((step, i) => {
              const ss = stepStatusStyles[step.status] || stepStatusStyles.pending;
              return (
                <Box key={i}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1.5,
                      px: 1.5,
                      borderRadius: '6px',
                      background: ss.bg,
                      mb: 0.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: `2px solid ${ss.color}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: ss.color,
                          fontFamily: '"JetBrains Mono", monospace',
                          ...(step.status === 'completed' && { bgcolor: 'rgba(0, 230, 118, 0.2)' }),
                          ...(step.status === 'running' && { animation: 'pulse-glow 2s infinite' }),
                        }}
                      >
                        {step.status === 'completed' ? <CheckCircle sx={{ fontSize: 16 }} /> : i + 1}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ color: step.status === 'pending' ? '#475569' : '#e2e8f0', fontWeight: step.status === 'running' ? 600 : 400 }}
                      >
                        {step.name}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ color: '#64748b', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.75rem' }}
                    >
                      {step.duration}
                    </Typography>
                  </Box>
                  {i < DEMO_JOB.steps.length - 1 && (
                    <Box sx={{ ml: 2.5, borderLeft: `1px solid ${step.status === 'pending' ? 'rgba(71, 85, 105, 0.3)' : 'rgba(0, 212, 255, 0.15)'}`, height: 8 }} />
                  )}
                </Box>
              );
            })}
          </Paper>
        </Grid>

        {/* Logs */}
        <Grid item xs={12} md={7}>
          <Paper
            elevation={0}
            sx={{ p: 3, background: 'rgba(17, 24, 39, 0.5)', border: '1px solid rgba(0, 212, 255, 0.08)', borderRadius: '12px', height: '100%' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Terminal sx={{ color: '#00e676', fontSize: 18 }} />
              <Typography variant="subtitle2" sx={{ color: '#00e676', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>
                Live Logs
              </Typography>
            </Box>
            <Divider sx={{ borderColor: 'rgba(0, 212, 255, 0.08)', mb: 2 }} />
            <Box
              sx={{
                bgcolor: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '8px',
                p: 2,
                maxHeight: 400,
                overflow: 'auto',
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.8rem',
                border: '1px solid rgba(0, 212, 255, 0.05)',
              }}
            >
              {DEMO_JOB.logs.map((line, i) => (
                <Box
                  key={i}
                  sx={{
                    py: 0.3,
                    color: line.includes('>>') ? '#7c4dff' : line.includes('OK') || line.includes('success') ? '#00e676' : '#94a3b8',
                    '&:hover': { background: 'rgba(0, 212, 255, 0.03)' },
                  }}
                >
                  <Box component="span" sx={{ color: '#475569', mr: 1 }}>{String(i + 1).padStart(2, '0')}</Box>
                  {line}
                </Box>
              ))}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, color: '#00d4ff' }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#00d4ff',
                    animation: 'pulse-dot 1.5s infinite',
                  }}
                />
                <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  Streaming...
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
