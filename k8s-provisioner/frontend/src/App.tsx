import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import ClusterList from './pages/cluster/ClusterList';
import ClusterCreate from './pages/cluster/ClusterCreate';
import ClusterDetails from './pages/cluster/ClusterDetails';
import JobList from './pages/job/JobList';
import JobDetails from './pages/job/JobDetails';
import TemplateList from './pages/template/TemplateList';

// Layout
import Layout from './components/layout/Layout';

// Futuristic K8s Dark Theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00d4ff',
      light: '#5ce1ff',
      dark: '#0097b2',
      contrastText: '#0a0e1a',
    },
    secondary: {
      main: '#7c4dff',
      light: '#b47cff',
      dark: '#3f1dcb',
    },
    success: {
      main: '#00e676',
      light: '#66ffa6',
      dark: '#00b248',
    },
    warning: {
      main: '#ff9100',
      light: '#ffc246',
      dark: '#c56200',
    },
    error: {
      main: '#ff1744',
      light: '#ff616f',
      dark: '#c4001d',
    },
    info: {
      main: '#00d4ff',
    },
    background: {
      default: '#0a0e1a',
      paper: '#111827',
    },
    text: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
    },
    divider: 'rgba(0, 212, 255, 0.12)',
  },
  typography: {
    fontFamily: [
      '"Inter"',
      '"JetBrains Mono"',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' as const, fontSize: '0.75rem' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(0, 212, 255, 0.03) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(124, 77, 255, 0.03) 0%, transparent 50%)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(17, 24, 39, 0.7)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 212, 255, 0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          fontWeight: 600,
          borderRadius: 8,
          letterSpacing: '0.02em',
        },
        contained: {
          background: 'linear-gradient(135deg, #00d4ff 0%, #7c4dff 100%)',
          boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5ce1ff 0%, #b47cff 100%)',
            boxShadow: '0 6px 20px rgba(0, 212, 255, 0.4)',
          },
        },
        outlined: {
          borderColor: 'rgba(0, 212, 255, 0.3)',
          '&:hover': {
            borderColor: '#00d4ff',
            backgroundColor: 'rgba(0, 212, 255, 0.08)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(0, 212, 255, 0.15)',
              transition: 'all 0.3s ease',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 212, 255, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00d4ff',
              boxShadow: '0 0 10px rgba(0, 212, 255, 0.15)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          letterSpacing: '0.02em',
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          '& .MuiStepIcon-root': {
            color: 'rgba(0, 212, 255, 0.2)',
            '&.Mui-active': {
              color: '#00d4ff',
              filter: 'drop-shadow(0 0 8px rgba(0, 212, 255, 0.5))',
            },
            '&.Mui-completed': {
              color: '#00e676',
              filter: 'drop-shadow(0 0 6px rgba(0, 230, 118, 0.4))',
            },
          },
          '& .MuiStepLabel-label': {
            fontWeight: 500,
            '&.Mui-active': {
              color: '#00d4ff',
            },
            '&.Mui-completed': {
              color: '#00e676',
            },
          },
          '& .MuiStepConnector-line': {
            borderColor: 'rgba(0, 212, 255, 0.15)',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: 'rgba(0, 212, 255, 0.06)',
            color: '#00d4ff',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase' as const,
            fontSize: '0.75rem',
            borderBottom: '1px solid rgba(0, 212, 255, 0.15)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 212, 255, 0.06)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 212, 255, 0.04) !important',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#111827',
          border: '1px solid rgba(0, 212, 255, 0.15)',
          boxShadow: '0 0 40px rgba(0, 212, 255, 0.1)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backdropFilter: 'blur(10px)',
        },
        standardInfo: {
          backgroundColor: 'rgba(0, 212, 255, 0.08)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          color: '#5ce1ff',
        },
        standardSuccess: {
          backgroundColor: 'rgba(0, 230, 118, 0.08)',
          border: '1px solid rgba(0, 230, 118, 0.2)',
          color: '#66ffa6',
        },
        standardWarning: {
          backgroundColor: 'rgba(255, 145, 0, 0.08)',
          border: '1px solid rgba(255, 145, 0, 0.2)',
          color: '#ffc246',
        },
        standardError: {
          backgroundColor: 'rgba(255, 23, 68, 0.08)',
          border: '1px solid rgba(255, 23, 68, 0.2)',
          color: '#ff616f',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0, 212, 255, 0.08)',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: '#00d4ff',
            '& + .MuiSwitch-track': {
              backgroundColor: 'rgba(0, 212, 255, 0.4)',
            },
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: 'rgba(0, 212, 255, 0.3)',
          '&.Mui-checked': {
            color: '#00d4ff',
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: 'rgba(0, 212, 255, 0.3)',
          '&.Mui-checked': {
            color: '#00d4ff',
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#111827',
          border: '1px solid rgba(0, 212, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 212, 255, 0.08)',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes with layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clusters" element={<ClusterList />} />
            <Route path="clusters/new" element={<ClusterCreate />} />
            <Route path="clusters/:id" element={<ClusterDetails />} />
            <Route path="jobs" element={<JobList />} />
            <Route path="jobs/:id" element={<JobDetails />} />
            <Route path="templates" element={<TemplateList />} />
          </Route>
        </Routes>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        theme="dark"
        toastStyle={{
          backgroundColor: '#111827',
          border: '1px solid rgba(0, 212, 255, 0.15)',
          borderRadius: '8px',
        }}
      />
    </ThemeProvider>
  );
}

export default App;
