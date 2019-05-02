#!/bin/bash
#
# benchmarking_setup.sh
# Sean Walker
# CPSC 490
# Sets up requisite libraries for benchmarking VNF performance.
#

# download DPDK
curl -sO http://fast.dpdk.org/rel/dpdk-16.11.9.tar.xz

# download Open vSwitch
curl -sO https://www.openvswitch.org/releases/openvswitch-2.7.2.tar.gz

# download Pktgen
curl -sO https://git.dpdk.org/apps/pktgen-dpdk/snapshot/pktgen-3.1.1.tar.gz

# decompress
tar -xf dpdk-16.11.9.tar.xz
tar -xf openvswitch-2.7.2.tar.gz
tar -xf pktgen-3.1.1.tar.gz

# remove the archives
rm *.tar.*z

# set environment variables
export DPDK_BUILD=x86_64-native-linuxapp-gcc
export DPDK_DIR=$(pwd)/dpdk-stable-16.11.9
export OVS_DIR=$(pwd)/openvswitch-2.7.2
export PKTGEN_DIR=$(pwd)/pktgen-3.1.1

# build DPDK, with capability to be linked to Open vSwitch
cd $DPDK_DIR
echo "CONFIG_RTE_BUILD_COMBINE_LIBS=y" >> config/common_linuxapp
make config O=$DPDK_BUILD T=$DPDK_BUILD
cd $DPDK_BUILD
make -j8    # feel free to use any other number of threads

# build Open vSwitch, linked to DPDK
cd $OVS_DIR
./boot.sh
CFLAGS='-march=native' ./configure --with-dpdk=$DPDK_DIR/$DPDK_BUILD
make -j8

# copy sources into Docker benchmarking directory
cd ..
cp -r $DPDK_DIR ./docker/benchmark/dpdk
cp -r $PKTGEN_DIR ./docker/benchmark/pktgen

# done
echo "done! benchmark image can now be built in `docker/benchmark`"