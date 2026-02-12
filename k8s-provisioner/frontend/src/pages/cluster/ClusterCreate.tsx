import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  Paper,
  CircularProgress,
  Container,
  Typography,
} from '@mui/material';
import { ArrowBack, ArrowForward, Close, RocketLaunch } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useClusterWizard } from '../../hooks/useClusterWizard';
import { clustersAPI } from '../../services/api';
import { ClusterCreatePayload } from '../../types/cluster';
import { WIZARD_STEPS } from '../../constants/cluster-config';

// Step components
import Step1BasicInfo from '../../components/cluster-wizard/Step1BasicInfo';
import Step2ComponentSelection from '../../components/cluster-wizard/Step2ComponentSelection';
import Step3NodeConfiguration from '../../components/cluster-wizard/Step3NodeConfiguration';
import Step4SSHAuthentication from '../../components/cluster-wizard/Step4SSHAuthentication';
import Step5ReviewProvision from '../../components/cluster-wizard/Step5ReviewProvision';

const ClusterCreate: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    activeStep,
    wizardData,
    updateBasicInfo,
    updateComponents,
    updateNodes,
    updateSSHConfig,
    updateHardening,
    handleNext,
    handleBack,
  } = useClusterWizard();

  const canProceedToNextStep = (): boolean => {
    switch (activeStep) {
      case 0:
        return (
          wizardData.basicInfo.name.length >= 3 &&
          wizardData.basicInfo.controlPlaneCount > 0 &&
          wizardData.basicInfo.workerCount >= 0
        );
      case 1:
        const hasTrafficManagement =
          wizardData.components.traffic_management_type === 'none' ||
          (wizardData.components.traffic_management_type === 'gateway-api' &&
            !!wizardData.components.gateway_api_controller) ||
          (wizardData.components.traffic_management_type === 'ingress' &&
            !!wizardData.components.ingress_controller);
        return (
          wizardData.components.kubernetes_version.length > 0 &&
          wizardData.components.cni.length > 0 &&
          wizardData.components.runtime.length > 0 &&
          hasTrafficManagement
        );
      case 2:
        const controlPlaneCount = wizardData.nodes.filter((n) => n.role === 'control-plane').length;
        const workerCount = wizardData.nodes.filter((n) => n.role === 'worker').length;
        return (
          wizardData.nodes.length > 0 &&
          controlPlaneCount === wizardData.basicInfo.controlPlaneCount &&
          workerCount === wizardData.basicInfo.workerCount &&
          controlPlaneCount > 0
        );
      case 3:
        if (wizardData.sshConfig.auth_method === 'password') {
          return (
            wizardData.sshConfig.username.length > 0 &&
            !!wizardData.sshConfig.password &&
            wizardData.sshConfig.password.length > 0
          );
        } else {
          return (
            wizardData.sshConfig.username.length > 0 &&
            !!wizardData.sshConfig.private_key &&
            wizardData.sshConfig.private_key.length > 0
          );
        }
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (canProceedToNextStep()) {
      handleNext();
    } else {
      toast.warning('Please complete all required fields before proceeding');
    }
  };

  const handleCreateCluster = async () => {
    setIsSubmitting(true);
    try {
      const payload: ClusterCreatePayload = {
        name: wizardData.basicInfo.name,
        description: wizardData.basicInfo.description || undefined,
        topology: {
          ha: wizardData.basicInfo.isHA,
          control_plane_count: wizardData.basicInfo.controlPlaneCount,
          worker_count: wizardData.basicInfo.workerCount,
        },
        components: {
          kubernetes_version: wizardData.components.kubernetes_version,
          cni: wizardData.components.cni,
          traffic_management_type: wizardData.components.traffic_management_type,
          gateway_api_controller: wizardData.components.gateway_api_controller,
          ingress_controller: wizardData.components.ingress_controller,
          runtime: wizardData.components.runtime,
          monitoring: wizardData.components.monitoring,
          logging: wizardData.components.logging,
        },
        nodes: wizardData.nodes.map((node) => ({
          name: node.name,
          role: node.role,
          ip_address: node.ip_address,
          ssh_port: node.ssh_port,
          os_type: node.os_type,
        })),
        ssh_config: {
          username: wizardData.sshConfig.username,
          auth_method: wizardData.sshConfig.auth_method,
          password: wizardData.sshConfig.password,
          private_key: wizardData.sshConfig.private_key,
          passphrase: wizardData.sshConfig.passphrase,
        },
        hardening: {
          cis_k8s_benchmark: wizardData.hardening.cis_k8s_benchmark,
          cis_linux_benchmark: wizardData.hardening.cis_linux_benchmark,
          pod_security_standards: wizardData.hardening.pod_security_standards,
        },
        provision_immediately: true,
      };

      const response = await clustersAPI.create(payload);
      const clusterId = response.data.cluster.id;
      toast.success('Cluster creation initiated successfully!');
      navigate(`/clusters/${clusterId}`);
    } catch (error: any) {
      console.error('Error creating cluster:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create cluster';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <Step1BasicInfo data={wizardData.basicInfo} onUpdate={updateBasicInfo} />;
      case 1:
        return <Step2ComponentSelection data={wizardData.components} onUpdate={updateComponents} />;
      case 2:
        return (
          <Step3NodeConfiguration
            nodes={wizardData.nodes}
            basicInfo={wizardData.basicInfo}
            onUpdate={updateNodes}
          />
        );
      case 3:
        return (
          <Step4SSHAuthentication
            data={wizardData.sshConfig}
            nodes={wizardData.nodes}
            onUpdate={updateSSHConfig}
          />
        );
      case 4:
        return <Step5ReviewProvision wizardData={wizardData} onUpdateHardening={updateHardening} />;
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          py: 4,
          animation: 'fadeIn 0.4s ease-out',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(8px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3 }}>
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
            Create Cluster
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Step {activeStep + 1} of {WIZARD_STEPS.length} — {WIZARD_STEPS[activeStep]}
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 4,
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
          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {WIZARD_STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          <Box sx={{ minHeight: '400px', mb: 4 }}>{renderStepContent(activeStep)}</Box>

          {/* Navigation Buttons */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              pt: 3,
              borderTop: '1px solid rgba(0, 212, 255, 0.08)',
            }}
          >
            <Button
              disabled={activeStep === 0 || isSubmitting}
              onClick={handleBack}
              variant="outlined"
              startIcon={<ArrowBack />}
              sx={{
                borderColor: 'rgba(0, 212, 255, 0.2)',
                color: '#94a3b8',
                '&:hover': {
                  borderColor: '#00d4ff',
                  color: '#00d4ff',
                  bgcolor: 'rgba(0, 212, 255, 0.05)',
                },
              }}
            >
              Back
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/clusters')}
                disabled={isSubmitting}
                startIcon={<Close />}
                sx={{
                  borderColor: 'rgba(255, 23, 68, 0.2)',
                  color: '#94a3b8',
                  '&:hover': {
                    borderColor: '#ff1744',
                    color: '#ff1744',
                    bgcolor: 'rgba(255, 23, 68, 0.05)',
                  },
                }}
              >
                Cancel
              </Button>

              {activeStep === WIZARD_STEPS.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleCreateCluster}
                  disabled={isSubmitting || !canProceedToNextStep()}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : <RocketLaunch />}
                  sx={{
                    px: 4,
                    background: 'linear-gradient(135deg, #00e676 0%, #00b248 100%)',
                    boxShadow: '0 4px 15px rgba(0, 230, 118, 0.3)',
                    '&:hover': {
                      boxShadow: '0 6px 25px rgba(0, 230, 118, 0.5)',
                    },
                  }}
                >
                  {isSubmitting ? 'Provisioning...' : 'Launch Cluster'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNextStep}
                  disabled={!canProceedToNextStep()}
                  endIcon={<ArrowForward />}
                  sx={{ px: 4 }}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ClusterCreate;
