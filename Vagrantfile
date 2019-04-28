# -*- mode: ruby -*-

# Vagrant file API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

['vagrant-reload', 'vagrant-disksize'].each do |plugin|
  unless Vagrant.has_plugin?(plugin)
    raise "Vagrant plugin #{plugin} is not installed!"
  end
end

$base_dir = File.dirname(__FILE__)
# the directory where the provisioning scripts are located
$scripts_dir = File.dirname(File.realdirpath(__FILE__))
# the utils submodule directory relative to the base
$submod_dir = Pathname.new($scripts_dir).relative_path_from(Pathname.new($base_dir))

$devbind_img = "seankwalker/dpdk-devbind:latest"
$dpdk_driver = "uio_pci_generic"
$dpdk_devices = "0000:00:08.0 0000:00:09.0 0000:00:0a.0 0000:00:10.0"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  # All Vagrant configuration is done here. The most common configuration
  # options are documented and commented below. For a complete reference,
  # please see the online documentation at https://docs.vagrantup.com.
  config.vm.box = "ubuntu/xenial64"
  config.disksize.size = "30GB"

  # e.g. for wireshark forwarding
  config.ssh.forward_x11 = true
  config.ssh.forward_agent = true

  config.vm.synced_folder ".", "/vagrant", disabled: false
  config.vm.provision "shell", inline: "echo 'cd /vagrant' >> /home/vagrant/.bashrc", run: "always"

  # specific IP. This option is needed because DPDK takes over the NIC.
  # 0000:00:08.0 used for netbricks
  config.vm.network "private_network", ip: "10.1.2.1", mac: "BADCAFEBEEF1", nic_type: "virtio"
  # 0000:00:09.0 used for moongen
  config.vm.network "private_network", ip: "10.1.2.2", mac: "BADCAFEBEEF2", nic_type: "virtio"
  # 0000:00:0a.0 used for containernet
  config.vm.network "private_network", ip: "10.1.2.3", mac: "BADCAFEBEEF3", nic_type: "virtio"
  # 0000:00:10.0 used for containernet
  config.vm.network "private_network", ip: "10.1.2.4", mac: "BADCAFEBEEF4", nic_type: "virtio"
  # used for ebpf testing
  config.vm.network "private_network", ip: "fe80::b8dc:afff:feeb:eef5", mac: "BADCAFEBEEF5"
  config.vm.network "private_network", ip: "fe80::b8dc:afff:feeb:eef6", mac: "BADCAFEBEEF6"

  # Setup the VM for DPDK, including binding the extra interface via the fetched
  # container
  config.vm.provision "shell", path: "#{$scripts_dir}/vm-kernel-upgrade.sh"
  config.vm.provision "reload"
  config.vm.provision "shell", path: "#{$scripts_dir}/vm-setup.sh"
  config.vm.provision "shell", path: "#{$scripts_dir}/containernet-setup.sh", args: ["#{$submod_dir}"]

  # Pull and run (then remove) our image in order to do the devbind
  config.vm.provision "docker" do |d|
    d.pull_images "#{$devbind_img}"
    d.run "#{$devbind_img}",
          auto_assign_name: false,
          args: %W(--rm
                   --privileged
                   --network=host
                   -v /lib/modules:/lib/modules
                   -v /dev/hugepages:/dev/hugepages).join(" "),
          restart: "no",
          daemonize: true,
          cmd: "/bin/bash -c 'dpdk-devbind --force -b #{$dpdk_driver} #{$dpdk_devices}'"
  end

  # VirtualBox-specific configuration
  config.vm.provider "virtualbox" do |vb|
    # Set machine name, memory and CPU limits
    vb.name = "ubuntu-xenial-cpsc-490"
    vb.memory = 4096

    # probably want to stick <= half your real machine's number of CPUs
    vb.cpus = 4

    # Configure VirtualBox to enable passthrough of SSE 4.1 and SSE 4.2 instructions,
    # according to this: https://www.virtualbox.org/manual/ch09.html#sse412passthrough
    # This step is fundamental otherwise DPDK won't build. It is possible to verify in
    # the guest OS that these changes took effect by running `cat /proc/cpuinfo` and
    # checking that `sse4_1` and `sse4_2` are listed among the CPU flags.
    vb.customize ["setextradata", :id, "VBoxInternal/CPUM/SSE4.1", "1"]
    vb.customize ["setextradata", :id, "VBoxInternal/CPUM/SSE4.2", "1"]

    # Allow promiscuous mode for host-only adapter
    vb.customize ["modifyvm", :id, "--nicpromisc2", "allow-all"]
    vb.customize ["modifyvm", :id, "--nicpromisc3", "allow-all"]
    vb.customize ["modifyvm", :id, "--nicpromisc4", "allow-all"]
    vb.customize ["modifyvm", :id, "--nicpromisc5", "allow-all"]
    vb.customize ["modifyvm", :id, "--nicpromisc6", "allow-all"]
    vb.customize ["modifyvm", :id, "--nicpromisc7", "allow-all"]
  end
end
