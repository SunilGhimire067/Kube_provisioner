import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import {
  ArrowBack,
  Cloud,
  Dns,
  Memory,
  Storage,
  CheckCircle,
  PlayArrow,
  Delete,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

const DEMO_CLUSTER = {
  id: 'cls-001',
  name: 'production-cluster',
  status: 'running',
  version: 'v1.29.0',
  cni: 'calico',
  runtime: 'containerd',
  created: '2024-01-15T10:30:00Z',
  nodes: [
    { name: 'cp-1', role: 'control-plane', ip: '10.0.1.10', status: 'ready', cpu: 72, memory: 65 },
    { name: 'cp-2', role: 'control-plane', ip: '10.0.1.11', status: 'ready', cpu: 58, memory: 52 },
    { name: 'cp-3', role: 'control-plane', ip: '10.0.1.12', status: 'ready', cpu: 45, memory: 48 },
    { name: 'worker-1', role: 'worker', ip: '10.0.2.10', status: 'ready', cpu: 82, memory: 71 },
    { name: 'worker-2', role: 'worker', ip: '10.0.2.11', status: 'ready', cpu: 35, memory: 40 },
  ],
};

const InfoField = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <Box sx={{ mb: 2 }}>
    <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.65rem' }}>
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        color: '#e2e8f0',
        fontWeight: 500,
        ...(mono && { fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem' }),
      }}
    >
      {value}
    </Typography>
  </Box>
);

export default function ClusterDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const cluster = DEMO_CLUSTER;

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/clusters')}
            sx={{ color: '#64748b', mb: 1, ml: -1, '&:hover': { color: '#00d4ff' } }}
          >
            Back to Clusters
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(124, 77, 255, 0.15))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Cloud sx={{ color: '#00d4ff', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  fontFamily: '"JetBrains Mono", monospace',
                  color: '#e2e8f0',
                }}
              >
                {cluster.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontFamily: '"JetBrains Mono", monospace' }}>
                {id || cluster.id}
              </Typography>
            </Box>
            <Chip
              label="RUNNING"
              size="small"
              sx={{
                bgcolor: 'rgba(0, 230, 118, 0.1)',
                color: '#00e676',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                fontWeight: 700,
                fontSize: '0.7rem',
                letterSpacing: '1px',
              }}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, mt: 4 }}>
          <Button
            variant="outlined"
            startIcon={<PlayArrow />}
            sx={{
              borderColor: 'rgba(0, 230, 118, 0.3)',
              color: '#00e676',
              '&:hover': { borderColor: '#00e676', background: 'rgba(0, 230, 118, 0.08)' },
            }}
          >
            kubectl
          </Button>
          <Button
            variant="outlined"
            startIcon={<Delete />}
            sx={{
              borderColor: 'rgba(255, 97, 111, 0.3)',
              color: '#ff616f',
              '&:hover': { borderColor: '#ff616f', background: 'rgba(255, 97, 111, 0.08)' },
            }}
          >
            Destroy
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Cluster Info */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: 'rgba(17, 24, 39, 0.5)',
              border: '1px solid rgba(0, 212, 255, 0.08)',
              borderRadius: '12px',
              height: '100%',
            }}
          >
            <Typography variant="subtitle2" sx={{ color: '#00d4ff', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem', mb: 2 }}>
              Cluster Information
            </Typography>
            <InfoField label="Kubernetes Version" value={cluster.version} mono />
            <InfoField label="Container Runtime" value={cluster.runtime} mono />
            <InfoField label="CNI Plugin" value={cluster.cni} mono />
            <InfoField label="Created" value={new Date(cluster.created).toLocaleDateString()} />
            <InfoField label="Total Nodes" value={`${cluster.nodes.length} nodes`} />
          </Paper>
        </Grid>

        {/* Resource Usage */}
        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: 'rgba(17, 24, 39, 0.5)',
              border: '1px solid rgba(0, 212, 255, 0.08)',
              borderRadius: '12px',
            }}
          >
            <Typography variant="subtitle2" sx={{ color: '#7c4dff', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem', mb: 3 }}>
              Resource Overview
            </Typography>
            <Grid container spacing={3}>
              {[
                { icon: <Dns />, label: 'Nodes', value: cluster.nodes.length, color: '#00d4ff' },
                { icon: <Memory />, label: 'Avg CPU', value: `${Math.round(cluster.nodes.reduce((a, n) => a + n.cpu, 0) / cluster.nodes.length)}%`, color: '#7c4dff' },
                { icon: <Storage />, label: 'Avg Memory', value: `${Math.round(cluster.nodes.reduce((a, n) => a + n.memory, 0) / cluster.nodes.length)}%`, color: '#ff9100' },
                { icon: <CheckCircle />, label: 'Health', value: 'Healthy', color: '#00e676' },
              ].map((metric, i) => (
                <Grid item xs={6} sm={3} key={i}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        background: `${metric.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 1,
                        '& svg': { color: metric.color, fontSize: 24 },
                      }}
                    >
                      {metric.icon}
                    </Box>
                    <Typography variant="h5" sx={{ color: '#e2e8f0', fontWeight: 700, fontFamily: '"JetBrains Mono", monospace' }}>
                      {metric.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>{metric.label}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Nodes Table */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              background: 'rgba(17, 24, 39, 0.5)',
              border: '1px solid rgba(0, 212, 255, 0.08)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 212, 255, 0.08)' }}>
              <Typography variant="subtitle2" sx={{ color: '#00e676', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.7rem' }}>
                Cluster Nodes
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>Node</TableCell>
                    <TableCell sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>Role</TableCell>
                    <TableCell sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>IP Address</TableCell>
                    <TableCell sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>Status</TableCell>
                    <TableCell sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>CPU</TableCell>
                    <TableCell sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>Memory</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cluster.nodes.map((node) => (
                    <TableRow key={node.name} sx={{ '&:hover': { background: 'rgba(0, 212, 255, 0.03)' } }}>
                      <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>
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
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem', color: '#00d4ff' }}>
                        {node.ip}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={node.status}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(0, 230, 118, 0.1)',
                            color: '#00e676',
                            border: '1px solid rgba(0, 230, 118, 0.2)',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                          <LinearProgress
                            variant="determinate"
                            value={node.cpu}
                            sx={{
                              flex: 1,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'rgba(124, 77, 255, 0.1)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                background: node.cpu > 80 ? '#ff9100' : 'linear-gradient(90deg, #7c4dff, #00d4ff)',
                              },
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: '"JetBrains Mono", monospace', minWidth: 35 }}>
                            {node.cpu}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                          <LinearProgress
                            variant="determinate"
                            value={node.memory}
                            sx={{
                              flex: 1,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'rgba(255, 145, 0, 0.1)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                background: node.memory > 80 ? '#ff1744' : 'linear-gradient(90deg, #ff9100, #ffab40)',
                              },
                            }}
                          />
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: '"JetBrains Mono", monospace', minWidth: 35 }}>
                            {node.memory}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
