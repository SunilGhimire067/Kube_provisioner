import { Box, Grid, Paper, Typography, Button, Chip } from '@mui/material';
import {
  Hub as HubIcon,
  Work as JobIcon,
  Dns as NodeIcon,
  Add as AddIcon,
  Speed as SpeedIcon,
  Shield as ShieldIcon,
  Cloud as CloudIcon,
  Terminal as TerminalIcon,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Metric card with glow effect
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
}

const MetricCard = ({ title, value, subtitle, icon, color, glowColor }: MetricCardProps) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      cursor: 'default',
      '&:hover': {
        borderColor: `${color}40`,
        boxShadow: `0 0 30px ${glowColor}`,
        transform: 'translateY(-2px)',
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      },
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
      <Box>
        <Typography
          variant="subtitle2"
          sx={{
            color: '#64748b',
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            mb: 1,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            color,
            textShadow: `0 0 20px ${glowColor}`,
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          {value}
        </Typography>
      </Box>
      <Box
        sx={{
          p: 1.5,
          borderRadius: '12px',
          background: `${color}10`,
          border: `1px solid ${color}20`,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
    </Box>
    <Typography variant="caption" sx={{ color: '#475569' }}>
      {subtitle}
    </Typography>
  </Paper>
);

// Quick action card
interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  gradient: string;
}

const ActionCard = ({ title, description, icon, onClick, gradient }: ActionCardProps) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      p: 3,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 30px rgba(0, 212, 255, 0.15)',
        borderColor: 'rgba(0, 212, 255, 0.2)',
      },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          p: 1.5,
          borderRadius: '12px',
          background: gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 600, color: '#e2e8f0' }}>
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          {description}
        </Typography>
      </Box>
      <ArrowForward sx={{ color: '#475569', fontSize: 18 }} />
    </Box>
  </Paper>
);

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        animation: 'fadeIn 0.5s ease-out',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #e2e8f0, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5,
          }}
        >
          Mission Control
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Kubernetes cluster orchestration overview
        </Typography>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Clusters"
            value={0}
            subtitle="No clusters provisioned yet"
            icon={<HubIcon />}
            color="#00d4ff"
            glowColor="rgba(0, 212, 255, 0.15)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Running Jobs"
            value={0}
            subtitle="No jobs running"
            icon={<JobIcon />}
            color="#7c4dff"
            glowColor="rgba(124, 77, 255, 0.15)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Nodes"
            value={0}
            subtitle="No nodes provisioned"
            icon={<NodeIcon />}
            color="#00e676"
            glowColor="rgba(0, 230, 118, 0.15)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="System Health"
            value="OK"
            subtitle="All systems operational"
            icon={<SpeedIcon />}
            color="#ff9100"
            glowColor="rgba(255, 145, 0, 0.15)"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Typography
            variant="subtitle2"
            sx={{
              color: '#64748b',
              mb: 2,
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <ActionCard
              title="Create New Cluster"
              description="Launch the cluster provisioning wizard"
              icon={<AddIcon />}
              onClick={() => navigate('/clusters/new')}
              gradient="linear-gradient(135deg, #00d4ff, #7c4dff)"
            />
            <ActionCard
              title="View All Clusters"
              description="Manage and monitor existing clusters"
              icon={<CloudIcon />}
              onClick={() => navigate('/clusters')}
              gradient="linear-gradient(135deg, #00e676, #00b248)"
            />
            <ActionCard
              title="API Documentation"
              description="Explore the REST API via Swagger"
              icon={<TerminalIcon />}
              onClick={() => window.open(`${API_URL}/docs`, '_blank')}
              gradient="linear-gradient(135deg, #ff9100, #c56200)"
            />
          </Box>
        </Grid>

        {/* Platform Status */}
        <Grid item xs={12} md={6}>
          <Typography
            variant="subtitle2"
            sx={{
              color: '#64748b',
              mb: 2,
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Platform Status
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 2,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #00e676, transparent)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <ShieldIcon sx={{ color: '#00e676', fontSize: 20 }} />
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#e2e8f0' }}>
                System Status
              </Typography>
              <Chip
                label="OPERATIONAL"
                size="small"
                sx={{
                  ml: 'auto',
                  bgcolor: 'rgba(0, 230, 118, 0.1)',
                  color: '#00e676',
                  border: '1px solid rgba(0, 230, 118, 0.2)',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  letterSpacing: '0.1em',
                }}
              />
            </Box>

            {[
              { label: 'API Server', status: 'online' },
              { label: 'Database', status: 'online' },
              { label: 'Task Queue', status: 'online' },
              { label: 'SSH Agent', status: 'online' },
            ].map((service) => (
              <Box
                key={service.label}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1,
                  borderBottom: '1px solid rgba(0, 212, 255, 0.04)',
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: '#94a3b8',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.8rem',
                  }}
                >
                  {service.label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box className="status-online" />
                  <Typography variant="caption" sx={{ color: '#00e676', fontSize: '0.7rem' }}>
                    Online
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>

          {/* Getting Started */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #7c4dff, transparent)',
              },
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#e2e8f0', mb: 1 }}>
              Getting Started
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2, lineHeight: 1.6 }}>
              Provision production-grade Kubernetes clusters on bare metal or VMs via SSH.
              Start by creating your first cluster using the provisioning wizard.
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => navigate('/clusters/new')}
              sx={{
                background: 'linear-gradient(135deg, #7c4dff 0%, #00d4ff 100%)',
                boxShadow: '0 4px 15px rgba(124, 77, 255, 0.3)',
              }}
            >
              Create First Cluster
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
