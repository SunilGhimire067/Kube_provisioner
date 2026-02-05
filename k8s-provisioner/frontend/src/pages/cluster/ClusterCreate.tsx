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
} from '@mui/material';
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

  // Validate current step before proceeding
  const canProceedToNextStep = (): boolean => {
    switch (activeStep) {
      case 0: // Basic Info
        return (
          wizardData.basicInfo.name.length >= 3 &&
          wizardData.basicInfo.controlPlaneCount > 0 &&
          wizardData.basicInfo.workerCount >= 0
        );
      case 1: // Component Selection
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
      case 2: // Node Configuration
        const controlPlaneCount = wizardData.nodes.filter((n) => n.role === 'control-plane').length;
        const workerCount = wizardData.nodes.filter((n) => n.role === 'worker').length;

        return (
          wizardData.nodes.length > 0 &&
          controlPlaneCount === wizardData.basicInfo.controlPlaneCount &&
          workerCount === wizardData.basicInfo.workerCount &&
          controlPlaneCount > 0
        );
      case 3: // SSH Authentication
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
      case 4: // Review & Provision
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
      // Transform wizard data to API payload format
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
      <Box sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 4 }}>
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
            <Button
              disabled={activeStep === 0 || isSubmitting}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/clusters')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              {activeStep === WIZARD_STEPS.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleCreateCluster}
                  disabled={isSubmitting || !canProceedToNextStep()}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                >
                  {isSubmitting ? 'Creating Cluster...' : 'Create Cluster'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNextStep}
                  disabled={!canProceedToNextStep()}
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
