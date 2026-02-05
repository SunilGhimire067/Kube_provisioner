# -*- mode: ruby -*-
# vi: set ft=ruby :

# LAB Environment for K8s Provisioner Testing
# Creates 1 control plane + 2 worker nodes

Vagrant.configure("2") do |config|
  # Base box - Rocky Linux 9
  # Using bento/rockylinux-9 (official Bento box) for reliable downloads
  config.vm.box = "bento/rockylinux-9"

  # Disable synced folder (fixes iCloud Drive permission issues)
  config.vm.synced_folder ".", "/vagrant", disabled: true

  # Common settings for all VMs
  config.vm.provider "virtualbox" do |vb|
    vb.memory = "2048"
    vb.cpus = 2
    vb.customize ["modifyvm", :id, "--natdnshostresolver1", "on"]
  end

  # SSH settings - use insecure key for testing
  config.ssh.insert_key = false
  config.ssh.private_key_path = ["~/.vagrant.d/insecure_private_key"]

  # Provisioning script for all nodes
  $common_script = <<-SCRIPT
    # Disable SELinux (for testing - not for production!)
    setenforce 0
    sed -i 's/^SELINUX=enforcing/SELINUX=disabled/' /etc/selinux/config

    # Update system
    dnf update -y

    # Install basic tools
    dnf install -y vim curl wget net-tools

    # Disable firewall (for testing - configure properly for production)
    systemctl stop firewalld
    systemctl disable firewalld

    # Enable SSH password authentication for testing
    sed -i 's/PasswordAuthentication no/PasswordAuthentication yes/' /etc/ssh/sshd_config
    systemctl restart sshd

    # Set a known password for vagrant user (for testing only!)
    echo "vagrant:vagrant" | chpasswd

    # Enable root SSH (for provisioner - not recommended for production)
    sed -i 's/#PermitRootLogin yes/PermitRootLogin yes/' /etc/ssh/sshd_config
    echo "root:vagrant" | chpasswd
    systemctl restart sshd

    echo "Node provisioning complete!"
  SCRIPT

  # Control Plane Node
  config.vm.define "k8s-cp-1" do |cp|
    cp.vm.hostname = "k8s-cp-1"
    cp.vm.network "private_network", ip: "192.168.56.10"

    cp.vm.provider "virtualbox" do |vb|
      vb.name = "k8s-cp-1"
      vb.memory = "4096"  # Control plane needs more memory
      vb.cpus = 2
    end

    cp.vm.provision "shell", inline: $common_script
  end

  # Worker Node 1
  config.vm.define "k8s-worker-1" do |worker|
    worker.vm.hostname = "k8s-worker-1"
    worker.vm.network "private_network", ip: "192.168.56.20"

    worker.vm.provider "virtualbox" do |vb|
      vb.name = "k8s-worker-1"
      vb.memory = "2048"
      vb.cpus = 2
    end

    worker.vm.provision "shell", inline: $common_script
  end

  # Worker Node 2
  config.vm.define "k8s-worker-2" do |worker|
    worker.vm.hostname = "k8s-worker-2"
    worker.vm.network "private_network", ip: "192.168.56.21"

    worker.vm.provider "virtualbox" do |vb|
      vb.name = "k8s-worker-2"
      vb.memory = "2048"
      vb.cpus = 2
    end

    worker.vm.provision "shell", inline: $common_script
  end
end
