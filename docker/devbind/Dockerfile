# Dockerfile for `dpdk-devbind` so as to bind DPDK NICs to drivers
# seankwalker/dpdk-devbind
FROM bitnami/minideb:stretch as dpdk-devbind

RUN install_packages \
  iproute2 \
  pciutils \
  python

COPY --from=builder /usr/local/share/dpdk/usertools/dpdk-devbind.py /usr/local/share/dpdk/usertools/dpdk-devbind.py
COPY --from=builder /usr/local/sbin/dpdk-devbind /usr/local/sbin/dpdk-devbind