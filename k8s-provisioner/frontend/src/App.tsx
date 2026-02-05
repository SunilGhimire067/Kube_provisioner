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

// Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
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
      <ToastContainer position="top-right" autoClose={5000} />
    </ThemeProvider>
  );
}

export default App;
