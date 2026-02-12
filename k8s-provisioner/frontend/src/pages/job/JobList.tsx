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
  LinearProgress,
} from '@mui/material';
import {
  Visibility,
  Refresh,
  WorkHistory,
  PlayArrow,
  CheckCircle,
  Error,
  HourglassBottom,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DEMO_JOBS = [
  { id: 'job-001', cluster: 'production-cluster', type: 'provision', status: 'completed', progress: 100, started: '2024-01-15 10:30', duration: '12m 34s' },
  { id: 'job-002', cluster: 'staging-cluster', type: 'provision', status: 'running', progress: 67, started: '2024-03-10 14:22', duration: '5m 12s' },
  { id: 'job-003', cluster: 'dev-cluster', type: 'upgrade', status: 'failed', progress: 45, started: '2024-03-09 09:15', duration: '3m 08s' },
  { id: 'job-004', cluster: 'production-cluster', type: 'scale', status: 'pending', progress: 0, started: '—', duration: '—' },
];

const statusConfig: Record<string, { icon: React.ReactNode; bg: string; color: string; border: string }> = {
  completed: { icon: <CheckCircle sx={{ fontSize: 14 }} />, bg: 'rgba(0, 230, 118, 0.1)', color: '#00e676', border: 'rgba(0, 230, 118, 0.3)' },
  running: { icon: <PlayArrow sx={{ fontSize: 14 }} />, bg: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff', border: 'rgba(0, 212, 255, 0.3)' },
  failed: { icon: <Error sx={{ fontSize: 14 }} />, bg: 'rgba(255, 23, 68, 0.1)', color: '#ff1744', border: 'rgba(255, 23, 68, 0.3)' },
  pending: { icon: <HourglassBottom sx={{ fontSize: 14 }} />, bg: 'rgba(255, 145, 0, 0.1)', color: '#ff9100', border: 'rgba(255, 145, 0, 0.3)' },
};

const typeColors: Record<string, { bg: string; color: string; border: string }> = {
  provision: { bg: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff', border: 'rgba(0, 212, 255, 0.2)' },
  upgrade: { bg: 'rgba(124, 77, 255, 0.1)', color: '#b47cff', border: 'rgba(124, 77, 255, 0.2)' },
  scale: { bg: 'rgba(255, 145, 0, 0.1)', color: '#ff9100', border: 'rgba(255, 145, 0, 0.2)' },
  destroy: { bg: 'rgba(255, 23, 68, 0.1)', color: '#ff1744', border: 'rgba(255, 23, 68, 0.2)' },
};

export default function JobList() {
  const navigate = useNavigate();

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <WorkHistory sx={{ color: '#7c4dff', fontSize: 28 }} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Jobs
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748b', ml: 5.5 }}>
            Monitor provisioning and management jobs
          </Typography>
        </Box>
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
      </Box>

      {/* Stats Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
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
          {DEMO_JOBS.length}{'  |  '}
          <Box component="span" sx={{ color: '#00e676', fontWeight: 600 }}>Completed:</Box>{' '}
          {DEMO_JOBS.filter((j) => j.status === 'completed').length}{'  |  '}
          <Box component="span" sx={{ color: '#00d4ff', fontWeight: 600 }}>Running:</Box>{' '}
          {DEMO_JOBS.filter((j) => j.status === 'running').length}{'  |  '}
          <Box component="span" sx={{ color: '#ff1744', fontWeight: 600 }}>Failed:</Box>{' '}
          {DEMO_JOBS.filter((j) => j.status === 'failed').length}
        </Typography>
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
              {['Job ID', 'Cluster', 'Type', 'Status', 'Progress', 'Started', 'Duration', ''].map((h) => (
                <TableCell
                  key={h}
                  align={h === '' ? 'right' : 'left'}
                  sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {DEMO_JOBS.map((job) => {
              const sc = statusConfig[job.status] || statusConfig.pending;
              const tc = typeColors[job.type] || typeColors.provision;
              return (
                <TableRow
                  key={job.id}
                  sx={{
                    '&:hover': { background: 'rgba(0, 212, 255, 0.03)' },
                    '& td': { borderBottom: '1px solid rgba(0, 212, 255, 0.05)' },
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>
                    {job.id}
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem', color: '#94a3b8' }}>
                    {job.cluster}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={job.type}
                      size="small"
                      sx={{
                        bgcolor: tc.bg,
                        color: tc.color,
                        border: `1px solid ${tc.border}`,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={sc.icon as React.ReactElement}
                      label={job.status}
                      size="small"
                      sx={{
                        bgcolor: sc.bg,
                        color: sc.color,
                        border: `1px solid ${sc.border}`,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        '& .MuiChip-icon': { color: sc.color },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                      <LinearProgress
                        variant="determinate"
                        value={job.progress}
                        sx={{
                          flex: 1,
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'rgba(100, 116, 139, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            background:
                              job.status === 'failed'
                                ? '#ff1744'
                                : job.status === 'completed'
                                ? '#00e676'
                                : 'linear-gradient(90deg, #00d4ff, #7c4dff)',
                          },
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: '"JetBrains Mono", monospace', minWidth: 35 }}>
                        {job.progress}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: '#64748b', fontSize: '0.85rem' }}>{job.started}</TableCell>
                  <TableCell sx={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '0.85rem', color: '#94a3b8' }}>
                    {job.duration}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}
                      sx={{ color: '#00d4ff' }}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
