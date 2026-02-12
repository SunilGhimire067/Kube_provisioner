import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  IconButton,
} from '@mui/material';
import {
  Add,
  ContentCopy,
  Delete,
  Edit,
  Description,
  Cloud,
  Dns,
  RocketLaunch,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DEMO_TEMPLATES = [
  {
    id: 'tpl-001',
    name: 'Production HA Cluster',
    description: 'High-availability cluster with 3 control planes, Calico CNI, and full monitoring stack',
    version: 'v1.29.0',
    nodes: 6,
    cni: 'calico',
    ha: true,
    tags: ['production', 'ha', 'monitoring'],
  },
  {
    id: 'tpl-002',
    name: 'Development Cluster',
    description: 'Lightweight single control plane cluster for development and testing',
    version: 'v1.29.0',
    nodes: 3,
    cni: 'flannel',
    ha: false,
    tags: ['development', 'lightweight'],
  },
  {
    id: 'tpl-003',
    name: 'Cilium Service Mesh',
    description: 'eBPF-powered networking with Cilium CNI and Gateway API integration',
    version: 'v1.28.4',
    nodes: 5,
    cni: 'cilium',
    ha: true,
    tags: ['service-mesh', 'ebpf', 'gateway-api'],
  },
];

const tagColors: Record<string, string> = {
  production: '#ff9100',
  ha: '#00e676',
  monitoring: '#7c4dff',
  development: '#00d4ff',
  lightweight: '#94a3b8',
  'service-mesh': '#e040fb',
  ebpf: '#ff5252',
  'gateway-api': '#00d4ff',
};

export default function TemplateList() {
  const navigate = useNavigate();

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Description sx={{ color: '#ff9100', fontSize: 28 }} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Templates
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#64748b', ml: 5.5 }}>
            Reusable cluster configuration templates
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{
            background: 'linear-gradient(135deg, #ff9100 0%, #ff5252 100%)',
            fontWeight: 600,
            px: 3,
            '&:hover': {
              background: 'linear-gradient(135deg, #e68200 0%, #e04848 100%)',
              boxShadow: '0 0 25px rgba(255, 145, 0, 0.3)',
            },
          }}
        >
          New Template
        </Button>
      </Box>

      {/* Template Cards */}
      <Grid container spacing={3}>
        {DEMO_TEMPLATES.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Paper
              elevation={0}
              sx={{
                p: 0,
                background: 'rgba(17, 24, 39, 0.5)',
                border: '1px solid rgba(0, 212, 255, 0.08)',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                },
              }}
            >
              {/* Card Header */}
              <Box
                sx={{
                  p: 2.5,
                  background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(124, 77, 255, 0.05))',
                  borderBottom: '1px solid rgba(0, 212, 255, 0.08)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ color: '#e2e8f0', fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
                      {template.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#475569', fontFamily: '"JetBrains Mono", monospace' }}>
                      {template.id}
                    </Typography>
                  </Box>
                  {template.ha && (
                    <Chip
                      label="HA"
                      size="small"
                      sx={{
                        bgcolor: 'rgba(0, 230, 118, 0.1)',
                        color: '#00e676',
                        border: '1px solid rgba(0, 230, 118, 0.3)',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 22,
                      }}
                    />
                  )}
                </Box>
              </Box>

              {/* Card Body */}
              <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, lineHeight: 1.6, flex: 1 }}>
                  {template.description}
                </Typography>

                {/* Stats */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Cloud sx={{ fontSize: 16, color: '#7c4dff' }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: '"JetBrains Mono", monospace' }}>
                      {template.version}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Dns sx={{ fontSize: 16, color: '#00d4ff' }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: '"JetBrains Mono", monospace' }}>
                      {template.nodes} nodes
                    </Typography>
                  </Box>
                </Box>

                {/* Tags */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                  {template.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{
                        bgcolor: `${tagColors[tag] || '#94a3b8'}15`,
                        color: tagColors[tag] || '#94a3b8',
                        border: `1px solid ${tagColors[tag] || '#94a3b8'}30`,
                        fontSize: '0.65rem',
                        height: 22,
                        fontWeight: 500,
                      }}
                    />
                  ))}
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid rgba(0, 212, 255, 0.06)' }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" sx={{ color: '#00d4ff' }}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" sx={{ color: '#94a3b8' }}><ContentCopy fontSize="small" /></IconButton>
                    <IconButton size="small" sx={{ color: '#ff616f' }}><Delete fontSize="small" /></IconButton>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<RocketLaunch sx={{ fontSize: 16 }} />}
                    onClick={() => navigate('/clusters/create')}
                    sx={{
                      borderColor: 'rgba(0, 230, 118, 0.3)',
                      color: '#00e676',
                      fontSize: '0.75rem',
                      py: 0.5,
                      '&:hover': {
                        borderColor: '#00e676',
                        background: 'rgba(0, 230, 118, 0.08)',
                      },
                    }}
                  >
                    Deploy
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
