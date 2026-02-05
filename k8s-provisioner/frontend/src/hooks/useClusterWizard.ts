import { useState } from 'react';
import { WizardData, BasicInfoData, ComponentsData, NodeData, SSHConfigData, HardeningData } from '../types/cluster';
import {
  DEFAULT_CONTROL_PLANE_COUNT_HA,
  DEFAULT_WORKER_COUNT,
  DEFAULT_SSH_USERNAME,
  DEFAULT_SSH_PORT,
  K8S_VERSIONS,
} from '../constants/cluster-config';

const initialWizardData: WizardData = {
  basicInfo: {
    name: '',
    description: '',
    isHA: false,
    controlPlaneCount: 1,
    workerCount: DEFAULT_WORKER_COUNT,
  },
  components: {
    kubernetes_version: K8S_VERSIONS[0],
    cni: 'calico',
    traffic_management_type: 'gateway-api',
    gateway_api_controller: 'envoy-gateway',
    ingress_controller: undefined,
    runtime: 'containerd',
    monitoring: false,
    logging: false,
  },
  nodes: [],
  sshConfig: {
    username: DEFAULT_SSH_USERNAME,
    auth_method: 'password',
    password: '',
    private_key: '',
    passphrase: '',
  },
  hardening: {
    cis_k8s_benchmark: true,
    cis_linux_benchmark: true,
    pod_security_standards: 'baseline',
    additional_k8s_config: false,
  },
};

export const useClusterWizard = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>(initialWizardData);

  const updateBasicInfo = (data: BasicInfoData) => {
    setWizardData((prev) => ({
      ...prev,
      basicInfo: data,
    }));
  };

  const updateComponents = (data: ComponentsData) => {
    setWizardData((prev) => ({
      ...prev,
      components: data,
    }));
  };

  const updateNodes = (nodes: NodeData[]) => {
    setWizardData((prev) => ({
      ...prev,
      nodes,
    }));
  };

  const updateSSHConfig = (data: SSHConfigData) => {
    setWizardData((prev) => ({
      ...prev,
      sshConfig: data,
    }));
  };

  const updateHardening = (data: HardeningData) => {
    setWizardData((prev) => ({
      ...prev,
      hardening: data,
    }));
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  const handleReset = () => {
    setActiveStep(0);
    setWizardData(initialWizardData);
  };

  const goToStep = (step: number) => {
    setActiveStep(step);
  };

  return {
    activeStep,
    wizardData,
    updateBasicInfo,
    updateComponents,
    updateNodes,
    updateSSHConfig,
    updateHardening,
    handleNext,
    handleBack,
    handleReset,
    goToStep,
  };
};
