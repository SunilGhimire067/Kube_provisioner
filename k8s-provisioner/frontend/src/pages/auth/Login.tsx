import { Box, Paper, Typography, TextField, Button, Container, Alert, InputAdornment } from '@mui/material';
import { Email, Lock, RocketLaunch } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';

// Animated Kubernetes Hex Background
const HexBackground = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      zIndex: 0,
    }}
  >
    {/* Gradient orbs */}
    <Box
      sx={{
        position: 'absolute',
        top: '20%',
        left: '15%',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 212, 255, 0.08) 0%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'float 8s ease-in-out infinite',
        '@keyframes float': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-20px) scale(1.05)' },
        },
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        bottom: '15%',
        right: '10%',
        width: 350,
        height: 350,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124, 77, 255, 0.08) 0%, transparent 70%)',
        filter: 'blur(40px)',
        animation: 'float 10s ease-in-out infinite 2s',
      }}
    />

    {/* Grid lines */}
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage:
          'linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }}
    />

    {/* Floating hex decorations */}
    <svg
      style={{ position: 'absolute', top: '10%', right: '20%', opacity: 0.08 }}
      width="120"
      height="120"
      viewBox="0 0 120 120"
    >
      <path d="M60 10L105 35v50L60 110 15 85V35L60 10z" fill="none" stroke="#00d4ff" strokeWidth="1" />
    </svg>
    <svg
      style={{ position: 'absolute', bottom: '20%', left: '10%', opacity: 0.05 }}
      width="80"
      height="80"
      viewBox="0 0 80 80"
    >
      <path d="M40 5L75 22.5v35L40 75 5 57.5v-35L40 5z" fill="none" stroke="#7c4dff" strokeWidth="1" />
    </svg>
  </Box>
);

// K8s Logo for Login
const K8sLoginLogo = () => (
  <Box
    sx={{
      width: 80,
      height: 80,
      mb: 3,
      animation: 'floatLogo 6s ease-in-out infinite',
      '@keyframes floatLogo': {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-8px)' },
      },
    }}
  >
    <svg viewBox="0 0 80 80" width="80" height="80">
      <defs>
        <linearGradient id="loginGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#7c4dff" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M40 5L70 22.5v35L40 75 10 57.5v-35L40 5z"
        fill="none"
        stroke="url(#loginGrad)"
        strokeWidth="2"
        filter="url(#glow)"
      />
      <path
        d="M40 18L56 27v18L40 54 24 45V27L40 18z"
        fill="none"
        stroke="url(#loginGrad)"
        strokeWidth="1.2"
        opacity="0.5"
      />
      <circle cx="40" cy="36" r="5" fill="url(#loginGrad)" filter="url(#glow)" />
      <line x1="40" y1="31" x2="40" y2="18" stroke="url(#loginGrad)" strokeWidth="1" opacity="0.4" />
      <line x1="40" y1="41" x2="40" y2="54" stroke="url(#loginGrad)" strokeWidth="1" opacity="0.4" />
      <line x1="35.5" y1="33.5" x2="24" y2="27" stroke="url(#loginGrad)" strokeWidth="1" opacity="0.4" />
      <line x1="44.5" y1="33.5" x2="56" y2="27" stroke="url(#loginGrad)" strokeWidth="1" opacity="0.4" />
      <line x1="35.5" y1="38.5" x2="24" y2="45" stroke="url(#loginGrad)" strokeWidth="1" opacity="0.4" />
      <line x1="44.5" y1="38.5" x2="56" y2="45" stroke="url(#loginGrad)" strokeWidth="1" opacity="0.4" />
    </svg>
  </Box>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(email, password);
      const data = response.data;

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#0a0e1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <HexBackground />
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: 'fadeInUp 0.6s ease-out',
            '@keyframes fadeInUp': {
              from: { opacity: 0, transform: 'translateY(20px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <K8sLoginLogo />

          <Paper
            elevation={0}
            sx={{
              p: 5,
              width: '100%',
              maxWidth: 440,
              background: 'rgba(17, 24, 39, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 212, 255, 0.1)',
              borderRadius: '16px',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, #00d4ff, #7c4dff, transparent)',
              },
            }}
          >
            <Typography
              component="h1"
              variant="h4"
              align="center"
              sx={{
                fontWeight: 700,
                mb: 0.5,
                background: 'linear-gradient(135deg, #00d4ff, #7c4dff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              K8s Provisioner
            </Typography>
            <Typography
              variant="body2"
              align="center"
              sx={{
                color: '#64748b',
                mb: 3,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontSize: '0.7rem',
              }}
            >
              Cluster Orchestration Platform
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#475569', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#475569', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                startIcon={loading ? undefined : <RocketLaunch />}
                disabled={loading || !email || !password}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #00d4ff 0%, #7c4dff 100%)',
                  boxShadow: '0 4px 20px rgba(0, 212, 255, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 30px rgba(0, 212, 255, 0.5)',
                  },
                  '&:disabled': {
                    background: 'rgba(0, 212, 255, 0.15)',
                    color: '#475569',
                  },
                }}
              >
                {loading ? 'Initializing...' : 'Launch Console'}
              </Button>

              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 212, 255, 0.08)',
                  background: 'rgba(0, 212, 255, 0.03)',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: '#475569',
                    display: 'block',
                    textAlign: 'center',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.7rem',
                  }}
                >
                  admin@k8s-provisioner.local / AdminPassword123!
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}
