# Dockerfile for benchmarking
# seankwalker/cpsc-490-benchmark
# adapted from https://github.com/intel/SDN-NFV-Hands-on-Samples

# Copyright (c) 2017 Intel Corporation

# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject to
# the following conditions:

# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
# OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
# IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
# CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
# TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

# Author: Clayne B. Robison <clayne dot b dot robison at intel dot com>

FROM ubuntu:xenial as builder
COPY ./ /root/benchmark
WORKDIR /root/benchmark
COPY ./dpdk /usr/src/dpdk
RUN apt-get upgrade && apt-get update && apt-get install -y build-essential \
        automake python-pip libcap-ng-dev gawk pciutils \
        linux-headers-$(uname -a | awk '{print $3}') vim kmod
RUN pip install -U pip six
ENV DPDK_DIR "/usr/src/dpdk"
ENV DPDK_BUILD "x86_64-native-linuxapp-gcc"
ENV RTE_SDK "/usr/src/dpdk"
ENV RTE_TARGET "x86_64-native-linuxapp-gcc"
RUN ./build_dpdk.sh
RUN ./build_testpmd.sh
CMD ["/bin/bash"]

FROM builder
COPY ./ /root/benchmark
WORKDIR /root/benchmark
COPY ./pktgen  /usr/src/pktgen
RUN apt-get update && apt-get install -y libpcap-dev
ENV PKTGEN_DIR "/usr/src/pktgen"
RUN ./build_pktgen.sh; exit 0
RUN ./build_pktgen.sh
CMD ["/bin/bash"]