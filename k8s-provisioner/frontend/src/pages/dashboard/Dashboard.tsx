import { Box, Grid, Paper, Typography } from '@mui/material';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Total Clusters
            </Typography>
            <Typography variant="h3">0</Typography>
            <Typography variant="body2" color="text.secondary">
              No clusters provisioned yet
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Active Jobs
            </Typography>
            <Typography variant="h3">0</Typography>
            <Typography variant="body2" color="text.secondary">
              No jobs running
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Total Nodes
            </Typography>
            <Typography variant="h3">0</Typography>
            <Typography variant="body2" color="text.secondary">
              No nodes provisioned
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Welcome to Kubernetes Provisioner Platform
            </Typography>
            <Typography variant="body1" paragraph>
              This platform allows you to provision Kubernetes clusters on bare metal or VMs via SSH.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Get started by creating your first cluster or check the API documentation at{' '}
              <a href={`${API_URL}/docs`} target="_blank" rel="noopener noreferrer">
                {`${API_URL}/docs`}
              </a>
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
