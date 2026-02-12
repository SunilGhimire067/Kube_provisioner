import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Chip,
  ListItemIcon,
  ListItemText,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  Storage as ClusterIcon,
  Work as JobIcon,
  Description as TemplateIcon,
  Add as AddIcon,
  List as ListIcon,
  Visibility as ViewIcon,
  SwapHoriz as SwapIcon,
  Hub as HubIcon,
  Terminal as TerminalIcon,
} from '@mui/icons-material';
import { authAPI } from '../../services/api';

interface UserInfo {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

// Kubernetes SVG Logo
const K8sLogo = () => (
  <Box
    sx={{
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mr: 1.5,
    }}
  >
    <svg viewBox="0 0 32 32" width="32" height="32">
      <defs>
        <linearGradient id="k8sGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#7c4dff" />
        </linearGradient>
      </defs>
      <path
        d="M16 2L28.124 9v14L16 30 3.876 23V9L16 2z"
        fill="none"
        stroke="url(#k8sGrad)"
        strokeWidth="1.5"
      />
      <path
        d="M16 8L22 11.5v7L16 22l-6-3.5v-7L16 8z"
        fill="none"
        stroke="url(#k8sGrad)"
        strokeWidth="1"
        opacity="0.6"
      />
      <circle cx="16" cy="16" r="2.5" fill="url(#k8sGrad)" />
      <line x1="16" y1="13.5" x2="16" y2="8" stroke="url(#k8sGrad)" strokeWidth="0.8" opacity="0.5" />
      <line x1="16" y1="18.5" x2="16" y2="22" stroke="url(#k8sGrad)" strokeWidth="0.8" opacity="0.5" />
      <line x1="13.8" y1="14.8" x2="10" y2="12" stroke="url(#k8sGrad)" strokeWidth="0.8" opacity="0.5" />
      <line x1="18.2" y1="14.8" x2="22" y2="12" stroke="url(#k8sGrad)" strokeWidth="0.8" opacity="0.5" />
      <line x1="13.8" y1="17.2" x2="10" y2="20" stroke="url(#k8sGrad)" strokeWidth="0.8" opacity="0.5" />
      <line x1="18.2" y1="17.2" x2="22" y2="20" stroke="url(#k8sGrad)" strokeWidth="0.8" opacity="0.5" />
    </svg>
  </Box>
);

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [clusterMenuEl, setClusterMenuEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch { /* ignore */ }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path: string) =>
    path === '/clusters'
      ? location.pathname === '/clusters'
      : location.pathname === path || location.pathname.startsWith(path + '/');

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon fontSize="small" /> },
    { label: 'Jobs', path: '/jobs', icon: <JobIcon fontSize="small" /> },
    { label: 'Templates', path: '/templates', icon: <TemplateIcon fontSize="small" /> },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'rgba(10, 14, 26, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 212, 255, 0.1)',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.3), rgba(124, 77, 255, 0.3), transparent)',
          },
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          {/* Logo & Brand */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mr: 4,
              cursor: 'pointer',
              '&:hover svg': {
                filter: 'drop-shadow(0 0 8px rgba(0, 212, 255, 0.5))',
              },
            }}
            onClick={() => navigate('/dashboard')}
          >
            <K8sLogo />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #00d4ff, #7c4dff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2,
                }}
              >
                K8s Provisioner
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(148, 163, 184, 0.6)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                Cluster Orchestration
              </Typography>
            </Box>
          </Box>

          {/* Navigation Links */}
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: '8px',
                  color: isActive(item.path) ? '#00d4ff' : '#94a3b8',
                  backgroundColor: isActive(item.path) ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                  borderBottom: isActive(item.path) ? '2px solid #00d4ff' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    color: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.05)',
                  },
                  '& .MuiButton-startIcon': {
                    color: isActive(item.path) ? '#00d4ff' : '#64748b',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}

            {/* Clusters Dropdown */}
            <Button
              color="inherit"
              startIcon={<ClusterIcon fontSize="small" />}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => setClusterMenuEl(e.currentTarget)}
              sx={{
                px: 2,
                py: 1,
                borderRadius: '8px',
                color: location.pathname.startsWith('/clusters') ? '#00d4ff' : '#94a3b8',
                backgroundColor: location.pathname.startsWith('/clusters') ? 'rgba(0, 212, 255, 0.08)' : 'transparent',
                borderBottom: location.pathname.startsWith('/clusters') ? '2px solid #00d4ff' : '2px solid transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  color: '#00d4ff',
                  backgroundColor: 'rgba(0, 212, 255, 0.05)',
                },
                '& .MuiButton-startIcon': {
                  color: location.pathname.startsWith('/clusters') ? '#00d4ff' : '#64748b',
                },
              }}
            >
              Clusters
            </Button>
            <Menu
              anchorEl={clusterMenuEl}
              open={Boolean(clusterMenuEl)}
              onClose={() => setClusterMenuEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              sx={{ mt: 1 }}
            >
              <MenuItem onClick={() => { setClusterMenuEl(null); navigate('/clusters'); }}>
                <ListItemIcon><ListIcon fontSize="small" sx={{ color: '#00d4ff' }} /></ListItemIcon>
                <ListItemText>All Clusters</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { setClusterMenuEl(null); navigate('/clusters/new'); }}>
                <ListItemIcon><AddIcon fontSize="small" sx={{ color: '#00e676' }} /></ListItemIcon>
                <ListItemText>Create Cluster</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem
                component="a"
                href="http://localhost:8000/docs#/Clusters/test_ssh_connection_api_v1_clusters_test_ssh_post"
                target="_blank"
                onClick={() => setClusterMenuEl(null)}
              >
                <ListItemIcon><SwapIcon fontSize="small" sx={{ color: '#7c4dff' }} /></ListItemIcon>
                <ListItemText>Test SSH (API)</ListItemText>
              </MenuItem>
              <MenuItem
                component="a"
                href="http://localhost:8000/docs"
                target="_blank"
                onClick={() => setClusterMenuEl(null)}
              >
                <ListItemIcon><ViewIcon fontSize="small" sx={{ color: '#94a3b8' }} /></ListItemIcon>
                <ListItemText>Swagger Docs</ListItemText>
              </MenuItem>
            </Menu>
          </Box>

          {/* Create Cluster Quick Action */}
          <Tooltip title="Create New Cluster" arrow>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => navigate('/clusters/new')}
              sx={{
                mr: 2,
                px: 2,
                background: 'linear-gradient(135deg, #00d4ff 0%, #7c4dff 100%)',
                boxShadow: '0 0 15px rgba(0, 212, 255, 0.2)',
                '&:hover': {
                  boxShadow: '0 0 25px rgba(0, 212, 255, 0.4)',
                },
              }}
            >
              New Cluster
            </Button>
          </Tooltip>

          {/* User Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {user && (
              <Chip
                label={user.role}
                size="small"
                sx={{
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  bgcolor: 'rgba(124, 77, 255, 0.15)',
                  color: '#b47cff',
                  border: '1px solid rgba(124, 77, 255, 0.3)',
                }}
              />
            )}
            <Tooltip title="Account" arrow>
              <IconButton
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget)}
                sx={{
                  border: '1px solid rgba(0, 212, 255, 0.15)',
                  '&:hover': {
                    borderColor: 'rgba(0, 212, 255, 0.3)',
                    backgroundColor: 'rgba(0, 212, 255, 0.05)',
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'rgba(0, 212, 255, 0.15)',
                    color: '#00d4ff',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  {user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              sx={{ mt: 1 }}
            >
              {user && (
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
                    {user.full_name || 'User'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {user.email}
                  </Typography>
                </Box>
              )}
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: '#ff616f' }}>
                <LogoutIcon fontSize="small" sx={{ mr: 1, color: '#ff616f' }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Container
        maxWidth="xl"
        sx={{
          mt: 4,
          mb: 4,
          flexGrow: 1,
          position: 'relative',
          zIndex: 1,
          animation: 'fadeIn 0.3s ease-out',
          '@keyframes fadeIn': {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
        }}
      >
        <Outlet />
      </Container>

      {/* Footer Bar */}
      <Box
        sx={{
          py: 1.5,
          px: 3,
          borderTop: '1px solid rgba(0, 212, 255, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(10, 14, 26, 0.6)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box className="status-online" />
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
              System Online
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.65rem' }}>
            |
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <HubIcon sx={{ fontSize: 12, color: '#475569' }} />
            <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.65rem' }}>
              API: localhost:8000
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TerminalIcon sx={{ fontSize: 12, color: '#475569' }} />
          <Typography
            variant="caption"
            sx={{
              color: '#475569',
              fontSize: '0.65rem',
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            v1.0.0
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
