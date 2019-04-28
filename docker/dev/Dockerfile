# Dockerfile for NetBricks-friendly container (DPDK + Rust)
# seankwalker/cpsc-490-dev
FROM seankwalker/dpdk:latest

ARG RUSTUP_TOOLCHAIN=nightly-2019-02-01
ARG BACKPORTS_REPO=/etc/apt/sources.list.d/stretch-backports.list
ARG IOVISOR_REPO=/etc/apt/sources.list.d/iovisor.list

ENV PATH=$PATH:/root/.cargo/bin
ENV LD_LIBRARY_PATH=/opt/netbricks/target/native:$LD_LIBRARY_PATH
ENV CARGO_INCREMENTAL=0
ENV RUST_BACKTRACE=1

RUN install_packages \
  # clang, libclang-dev and libsctp-dev are netbricks deps
  # libssl-dev and pkg-config are rust deps
    build-essential \
    ca-certificates \
    clang \
    curl \
    gdb \
    gdbserver \
    libclang-dev \
    libcurl4-gnutls-dev \
    libgnutls30 \
    libgnutls-openssl-dev \
    libsctp-dev \
    libssl-dev \
    pkg-config \
    python-pip \
    python-setuptools \
    python-wheel \
    sudo \
    tcpdump \
  # pyroute2 and toml are agent deps
  && pip install \
    pyroute2 \
    toml \
  # install bcc tools
  && echo "deb [trusted=yes] http://repo.iovisor.org/apt/xenial xenial-nightly main" > ${IOVISOR_REPO} \
  && apt-get update -o Dir::Etc::sourcelist=${IOVISOR_REPO} \
  && apt-get -t xenial-nightly install -y --no-install-recommends bcc-tools \
  && rm -rf /var/lib/apt/lists /var/cache/apt/archives \
  # install rust nightly and tools
  && curl -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain $RUSTUP_TOOLCHAIN \
  && rustup component add \
    clippy-preview \
    rustfmt-preview \
    rust-src \
  # invoke cargo install independently otherwise partial failure has the incorrect exit code
  && cargo install cargo-watch \
  && cargo install cargo-expand \
  && cargo install hyperfine \
  && cargo install ripgrep \
  && cargo install sccache \
  && rm -rf /root/.cargo/registry

ENV RUSTC_WRAPPER=sccache

COPY ./entrypoint.sh /

ENTRYPOINT ["/entrypoint.sh"]

CMD ["/bin/bash"]
