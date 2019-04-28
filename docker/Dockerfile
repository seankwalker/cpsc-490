# dockerfile for `dpdk` image on docker hub
# seankwalker/dpdk:latest

# compile dpdk from source
FROM bitnami/minideb:stretch as builder

ARG DPDK_VERSION
ARG RTE_SDK=/tmp/dpdk-stable-${DPDK_VERSION}
ARG CFLAGS="-g3 -Wno-error=maybe-uninitialized -fPIC"

RUN install_packages \
    build-essential \
    ca-certificates \
    curl \
    libnuma-dev \
    libpcap-dev \
    xz-utils \
  && cd /tmp \
  && curl -sSf https://fast.dpdk.org/rel/dpdk-${DPDK_VERSION}.tar.xz | tar -xJv

COPY common_linuxapp-17.08.container ${RTE_SDK}/config/common_linuxapp
COPY defconfig_x86_64-nhm-linuxapp-gcc ${RTE_SDK}/config/defconfig_x86_64-nhm-linuxapp-gcc

WORKDIR ${RTE_SDK}

RUN make config T=x86_64-nhm-linuxapp-gcc EXTRA_CFLAGS="${CFLAGS}" \
  && make -j$(nproc) EXTRA_CFLAGS="${CFLAGS}" \
  && make install

# image with DPDK dev libs and utils
FROM bitnami/minideb:stretch as dpdk

RUN install_packages \
  iproute2 \
  libnuma-dev \
  libpcap-dev \
  pciutils \
  python

COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /usr/local/include /usr/local/include
COPY --from=builder /usr/local/lib /usr/local/lib/dpdk
COPY --from=builder /usr/local/sbin /usr/local/sbin
COPY --from=builder /usr/local/share/dpdk /usr/local/share/dpdk

ENV RTE_SDK=/opt/dpdk

RUN mkdir -p ${RTE_SDK}/build \
  && ln -s /usr/local/lib/dpdk ${RTE_SDK}/build/lib \
  && ln -s /usr/local/include/dpdk ${RTE_SDK}/build/include
