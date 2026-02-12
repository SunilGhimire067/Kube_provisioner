import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  InputAdornment,
  TextField,
} from '@mui/material';
import {
  Add,
  Visibility,
  Delete,
  Search,
  Cloud,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Placeholder data for demo
const DEMO_CLUSTERS = [
  { id: 'cls-001', name: 'production-cluster', status: 'running', nodes: 5, version: 'v1.29.0', created: '2024-01-15' },
  { id: 'cls-002', name: 'staging-cluster', status: 'running', nodes: 3, version: 'v1.28.4', created: '2024-02-20' },
  { id: 'cls-003', name: 'dev-cluster', status: 'provisioning', nodes: 2, version: 'v1.29.0', created: '2024-03-10' },
];

const statusColors: Record<string, { bg: string; color: string; border: string }> = {
  running: { bg: 'rgba(0, 230, 118, 0.1)', color: '#00e676', border: 'rgba(0, 230, 118, 0.3)' },
  provisioning: { bg: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff', border: 'rgba(0, 212, 255, 0.3)' },
  failed: { bg: 'rgba(255, 23, 68, 0.1)', color: '#ff1744', border: 'rgba(255, 23, 68, 0.3)' },
  stopped: { bg: 'rgba(100, 116, 139, 0.1)', color: '#94a3b8', border: 'rgba(100, 116, 139, 0.3)' },
};

export default function ClusterList() {
  const navigate = useNavigate();

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Cloud sx={{ color: '#00d4ff', fontSize: 28 }} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Clusters
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748b', ml: 5.5 }}>
            Manage your Kubernetes clusters
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            sx={{
              borderColor: 'rgba(0, 212, 255, 0.2)',
              color: '#94a3b8',
              '&:hover': { borderColor: '#00d4ff', color: '#00d4ff' },
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/clusters/create')}
            sx={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #7c4dff 100%)',
              fontWeight: 600,
              px: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, #00bce0 0%, #6a3de8 100%)',
                boxShadow: '0 0 25px rgba(0, 212, 255, 0.3)',
              },
            }}
          >
            New Cluster
          </Button>
        </Box>
      </Box>

      {/* Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          background: 'rgba(17, 24, 39, 0.5)',
          border: '1px solid rgba(0, 212, 255, 0.08)',
        }}
      >
        <TextField
          fullWidth
          placeholder="Search clusters by name, ID, or status..."
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#475569' }} />
              </InputAdornment>
            ),
            sx: { fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem' },
          }}
        />
      </Paper>

      {/* Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid rgba(0, 212, 255, 0.08)',
          background: 'rgba(17, 24, 39, 0.5)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ '& th': { borderBottom: '1px solid rgba(0, 212, 255, 0.1)' } }}>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>
                Cluster
              </TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>
                Status
              </TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>
                Nodes
              </TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>
                Version
              </TableCell>
              <TableCell sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>
                Created
              </TableCell>
              <TableCell align="right" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {DEMO_CLUSTERS.map((cluster) => {
              const sc = statusColors[cluster.status] || statusColors.stopped;
              return (
                <TableRow
                  key={cluster.id}
                  sx={{
                    '&:hover': { background: 'rgba(0, 212, 255, 0.03)' },
                    '& td': { borderBottom: '1px solid rgba(0, 212, 255, 0.05)' },
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/clusters/${cluster.id}`)}
                >
                  <TableCell>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ color: '#e2e8f0', fontWeight: 600, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem' }}
                      >
                        {cluster.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#475569', fontFamily: '"JetBrains Mono", monospace' }}>
                        {cluster.id}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cluster.status}
                      size="small"
                      sx={{
                        bgcolor: sc.bg,
                        color: sc.color,
                        border: `1px solid ${sc.border}`,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem', color: '#94a3b8' }}>
                      {cluster.nodes}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cluster.version}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(124, 77, 255, 0.1)',
                        color: '#b47cff',
                        border: '1px solid rgba(124, 77, 255, 0.2)',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: '0.75rem',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                      {cluster.created}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); navigate(`/clusters/${cluster.id}`); }}
                      sx={{ color: '#00d4ff' }}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => e.stopPropagation()}
                      sx={{ color: '#ff616f' }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary Bar */}
      <Paper
        elevation={0}
        sx={{
          mt: 2,
          p: 2,
          background: 'rgba(0, 212, 255, 0.04)',
          border: '1px solid rgba(0, 212, 255, 0.1)',
          borderRadius: '8px',
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: '#94a3b8', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem' }}
        >
          <Box component="span" sx={{ color: '#00d4ff', fontWeight: 600 }}>Total:</Box>{' '}
          {DEMO_CLUSTERS.length} clusters{'  |  '}
          <Box component="span" sx={{ color: '#00e676', fontWeight: 600 }}>Running:</Box>{' '}
          {DEMO_CLUSTERS.filter((c) => c.status === 'running').length}{'  |  '}
          <Box component="span" sx={{ color: '#ff9100', fontWeight: 600 }}>Provisioning:</Box>{' '}
          {DEMO_CLUSTERS.filter((c) => c.status === 'provisioning').length}
        </Typography>
      </Paper>
    </Box>
  );
}
