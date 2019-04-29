#!/bin/bash

export DEBIAN_FRONTEND=noninteractive
export WIRESHARK_VERS=2.6.4

# Install dependencies
sudo apt-get -q update
sudo apt-get -q install -y cmake mg make git linux-headers-$(uname -r) clang-format \
                           pkg-config linux-image-extra-$(uname -r) xauth xterm \
                           libcap-dev libgcrypt11-dev libglib2.0-dev \
                           qt5-default libqt5multimedia5 qtmultimedia5-dev \
                           libpcap-dev libqt5svg5-dev qttools5-dev \
                           qttools5-dev-tools ntp npm

# update node
sudo ln -s /usr/bin/nodejs /usr/local/bin/node
sudo npm install -g n
sudo n latest

# Install Wireshark from src due to some vagrant/vm issues.
# Commented out as it can take a while to setup. Use locally if you want.
#
# wget https://www.wireshark.org/download/src/all-versions/wireshark-$WIRESHARK_VERS.tar.xz
# tar -xJf wireshark-$WIRESHARK_VERS.tar.xz
# rm wireshark-$WIRESHARK_VERS.tar.xz
# cd wireshark-$WIRESHARK_VERS && ./configure && make -j$(nproc) && sudo make install && sudo ldconfig


# Allocate 1024 hugepages of 2 MB
# Change can be validated by executing 'cat /proc/meminfo | grep Huge'
echo 1024 > /sys/kernel/mm/hugepages/hugepages-2048kB/nr_hugepages

# Allocate 1024 hugepages of 2 MB at startup
echo "vm.nr_hugepages = 1024" >> /etc/sysctl.conf

# Install the uio_pci_generic driver
modprobe uio_pci_generic

# Load modules at boot
echo "uio" >> /etc/modules
echo "uio_pci_generic" >> /etc/modules

# Ensure the following `proc` variables are set correctly
echo "net.ipv6.conf.all.disable_ipv6 = 0
net.ipv6.conf.default.forwarding = 1
net.ipv6.conf.default.accept_source_route = 1
net.ipv6.conf.default.accept_ra = 2
net.ipv6.conf.all.forwarding = 1
net.ipv6.conf.all.accept_source_route = 1
net.ipv6.conf.all.accept_ra = 2
net.ipv6.conf.all.seg6_enabled = 1
net.ipv6.conf.default.seg6_enabled = 1" >> /etc/sysctl.conf

sysctl -e -p