# CPSC 490 (Project Title TBD)

This repository contains code relevant to my undergraduate thesis.

## Front Matter

My thesis builds on top of [NetBricks](http://netbricks.io/), a framework for
virtual network function (VNF) development originally created by Aurojit Panda,
Sangjin Han, Keon Jang, Melvin Walls, Sylvia Ratnasamy, and Scott Shenker.

Because at the time of development the
[original NetBricks source code](https://github.com/netsys/netbricks) was
fraught with build errors and to speed up development, I used a fork of the
original code which was developed by Comcast's Occam Engineering team, available
[here](https://github.com/williamofockham/NetBricks).

My fork, upon which the project is ultimately built, is available
[here](https://github.com/seankwalker/NetBricks).

### Project Structure

`docker/` contains subdirectories which have Dockerfiles for building the images
used for this project. In particular, `docker/dev` builds the
[dev image](https://cloud.docker.com/repository/docker/seankwalker/cpsc-490-dev)
, which is used for running the project, and `docker/dpdk` builds the
[full DPDK image](https://cloud.docker.com/repository/docker/seankwalker/dpdk),
which contains more DPDK testing and debugging tools.

`server/` contains code related to the server (written in Express) which should
be running on a routing/load-balancing middlebox which communicates with the
orchestrator. In particular, this server's job is to receive configuration files
from the orchestrator. Each config file, written in the JSON format, is parsed
as a directed graph defining a VNF service chain. The server then either routes
the traffic specified by the server to an already-existing container on some
other middlebox which is running the specified service chain (and has enough
capacity to serve another client) or spins up a new container with the service
chain and routes the traffic there.

`vagrant/` contains configuration files and scripts used by Vagrant.

## Getting Started

### Overview

The code in this repo is structured such that it can be used for both
development and running in "production."

For "production," the goal is that a VNF service chain is dynamically created by
the server. The server then will spin up a Docker container which runs that
service chain.

As one might imagine, it's much easier to test and run code during development
in an environment which doesn't need to be dynamically spin up constantly. To
this end, one can instead simply run the same Docker image the server uses for
its service chains from the command line and run the code one wishes inside that
container.

The following sections outline the process from a broader perspective. Notes are
provided in each section on how development and production modes accomplish the
task.

### Building

NetBricks requires a number of hardware and software prerequisites, which is
linked in the README of the repository. Comcast's Occam team's fork has a
variety of open source tools and code they use to streamline the development
process (it also allows building and running the code on OSX).

More detailed instructions can be found in the individual repos, but the vital
steps are outlined here (following them will be sufficient to get up and
running).

#### Environment Setup

Docker, Vagrant and VirtualBox are used to emulate an Ubuntu Linux environment
with the necessary devices, libraries, and software to be used for building and
developing NetBricks.

A script which automates steps 2-4 is available in `setup.sh`.

1. Download and install [Docker](https://www.docker.com/get-started),
   [Vagrant](https://www.vagrantup.com/downloads.html) and
   [VirtualBox](https://www.virtualbox.org/wiki/Downloads).

2. Set the environment variable `VAGRANT_CWD` to `vagrant`, _i.e._

   ```shell
   export VAGRANT_CWD=vagrant
   ```

3. Install two Vagrant plugins: `vagrant-disksize` and `vagrant-reload`, via
   `vagrant plugin install`.

4. Clone the following repository:

   - `git@github.com:seankwalker/NetBricks`

The dev VM can now be booted via

`vagrant up`

Once finished with the VM, it can be shut down via

`vagrant halt`

#### Using Vagrant and Docker

Vagrant can be configured by editing `Vagrantfile` (in the `vagrant` directory),
if so desired.

The VM can now be accessed by running `vagrant ssh`. `ssh` will enter in this
repo's root directory, but running in the Ubuntu VM.

##### Development

Running the `docker_init.sh` script with a singular command line argument,
`run`, will pull the latest `seankwalker/dpdk` image from Docker Hub and then
run a container from that image.

The Docker container provides an environment where NetBricks can be successfully
built. The container should start in the `NetBricks` directory, so simply run
`./build.sh build` to build NetBricks.

##### Production

Since the server will be dynamically spinning up all containers based on the
`seankwalker/dpdk` image from Docker Hub, simply run `docker_init.sh` with no
arguments. This will pull the image, but not start a container.

## Running Network Functions (Development)

Once NetBricks is built, any files using it as a dependency can now be run.
Following the convention from the original repository, network functions (NFs)
live in the `test` directory. There are several ways to run any NF,
but a special script, `build.sh`, has been written to ease the process.

`build.sh` targets all submodules in the `test` directory. Each of these
submodules should have a `Cargo.toml` and should additionally be listed as a
workspace member in the top-level `Cargo.toml` for the whole project. Finally,
each one should also be listed in the variable declared in `examples.sh` so
the `build.sh` script knows what to check for. This allows selective building
of only tests which are targeted in `examples.sh` without modifying the
workspace members.

Alternatively, one can run a specific NF via `./build.sh run <name>`. The name
of the NF is specified in the `Cargo.toml` file contained within the
subdirectory of `test` containing that network function. The name of the
subdirectory should be the same as the package name specified in the NF's
`Cargo.toml`.

For example, `maglev` can be run via

```shell
./build.sh run maglev
```

### Testing with `.pcap` Files

New NFs (_i.e._ those not in the original NetBricks release) have been written
to take in sample packet data as a way of testing. Thus, they should be run with
specific flags. In particular, each NF should have a `check.sh` script in its
subdirectory, which should specify the options to run with.

### Testing with a Traffic Generator

If you want to test traffic from a traffic generator, it suffices to leverage
[`testpmd`](https://dpdk.readthedocs.io/en/v17.08/testpmd_app_ug/), which is
provided in the `dev` Docker container. To use it,

1.  Ensure that the two network devices on the image are bound to
    DPDK-compatible drivers:

    - In the container, run
      `shell dpdk-devbind --status`
      If the output shows two devices listed under devices using a
      DPDK-compatible driver, they are successfully bound; it should look
      something like this:

      ```
      Network devices using DPDK-compatible driver
      ============================================
      0000:00:08.0 'Virtio network device 1000' drv=uio_pci_generic unused=
      0000:00:09.0 'Virtio network device 1000' drv=uio_pci_generic unused=
      ```

      Otherwise, the devices need to be bound to the DPDK-compatible driver. If
      this is the case, `dpdk-devbind` should have outputted something like
      this:

      ```
      Network devices using kernel driver
      ===================================
      0000:00:03.0 '82540EM Gigabit Ethernet Controller' if=enp0s3 drv=e1000 unused=igb_uio,uio_pci_generic *Active*
      0000:00:08.0 'Virtio network device' if=enp0s8 drv=virtio-pci unused=uio_pci_generic *Active*
      0000:00:09.0 'Virtio network device' if=enp0s9 drv=virtio-pci unused=uio_pci_generic *Active*
      ```

      The `unused` note indicates that the `uio_pci_generic` (a DPDK-compatible
      driver) can be used on this device but is currently not being used. To
      bind, run the following in the shell:

      ```shell
      dpdk-devbind --force -b 0000:00:08.0 uio_pci_generic && \
      dpdk-devbind --force -b 0000:00:09.0 uio_pci_generic
      ```

      (The network device addresses above should be the same on all VMs, as they
      are specified in the `Vagrantfile`. If for whatever reason different
      device addresses are found, of course those should be replaced here.)

2.  Once the devices are bound to DPDK-compatible drivers, data can now be sent
    to them using DPDK tools. One could use `pktgen` here, but for sake of
    simplicity, instructions will be provided only for using `testpmd.`

    - First, run the desired NF chain (or individual NF). If it was, say, the
      Firewall -> DPI -> NAT example referenced (below, in the Server section),
      one might run something like:

      ```shell
      cpsc-490/build.sh firewall-dpi-nat -c 1 -p dpdk:eth_pcap0,iface=enp0s3 > test.out 2>&1 &
      ```

      (Note that for running individual NFs, one would be running the binaries
      directly or using the root-level `build.sh`, rather than the one in the
      `NetBricks/cpsc-490` subdirectory, which is meant to be used on NF service
      chains rather than individual NFs.)

      In other words, the `firewall-dpi-nat` executable is run (in the
      background) with one core (`-c 1`) and using DPDK for its data port setup,
      set to the `enp0s3` interface. Output is redirected to `test.out` for
      logging.

      In the above example, `en0ps3` is used as it is the name of the actual
      network device of the VM. This can be found by running `dpdk-devbind` and
      looking under "Network devices using kernel driver," or by running

      ```shell
      ip link show
      ```

      and locating the only non-Docker non-loopback device.

    - Next, run `testpmd` to send traffic from one virtual device (generator) to
      the other (the NetBricks NF) over the specified interface, _e.g._

      ```shell
      testpmd --vdev "eth_pcap0,iface=enp0s3" -- --interactive --port-topology=chained
      ```

      Note that in the above example, one should wait a bit for the NF to start
      (as it may take some time for `Cargo` to re-build, if one uses the build
      script; one could alternatively directly run the binary) before starting
      `testpmd`.

      This will start `testpmd` in interactive mode. Initially, it should output
      a message like this:

      ```
      EAL: Detected 4 lcore(s)
      EAL: Probing VFIO support...
      EAL: PCI device 0000:00:03.0 on NUMA socket -1
      EAL:   Invalid NUMA socket, default to 0
      EAL:   probe driver: 8086:100e net_e1000_em
      EAL: PCI device 0000:00:08.0 on NUMA socket -1
      EAL:   Invalid NUMA socket, default to 0
      EAL:   probe driver: 1af4:1000 net_virtio
      EAL: PCI device 0000:00:09.0 on NUMA socket -1
      EAL:   Invalid NUMA socket, default to 0
      EAL:   probe driver: 1af4:1000 net_virtio
      PMD: Initializing pmd_pcap for eth_pcap0
      PMD: Creating pcap-backed ethdev on numa socket 4294967295
      Interactive-mode selected
      Warning: NUMA should be configured manually by using --port-numa-config and --ring-numa-config parameters along with --numa.
      USER1: create a new mbuf pool <mbuf_pool_socket_0>: n=171456, size=2176, socket=0
      Configuring Port 0 (socket 0)
      Port 0: BA:DC:AF:EB:EE:F1
      Configuring Port 1 (socket 0)
      Port 1: BA:DC:AF:EB:EE:F2
      Configuring Port 2 (socket 0)
      Port 2: 00:00:00:01:02:03
      Checking link statuses...
      Done
      ```

      as well as a prompt for input. At the prompt, run

      ```
      start tx_first
      ```

      to begin packet transmission. When finished, run

      ```
      stop
      ```

      and then when finished with `testpmd`, run

      ```
      quit
      ```

      to exit the application.

3)  After running the above, traffic should run from the generator to the NF
    running on the other network device. This traffic can then be logged,
    benchmarked, etc.

## Running the Server (Production)

To run the server, in the Vagrant Ubuntu VM, move into the `server` directory
and start the server, _e.g._

```shell
cd server; npm i; npm start
```

(One need only run `npm i` once, to install requisite packages. Thereafter,
the server can be stopped via `SIGINT` or otherwise as usual and restart via
`npm start`.)

The server is now accessible. By default, it runs on port 3000; this can be
changed in `server/server.js` if you wish.

### Server API

#### Endpoints

| Method | Endpoint      | Parameters                         | Description                                                                                      |
| ------ | ------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| POST   | /capacity     | `data`: `.json` configuration file | Lists remaining connection capacity for all containers currently running specified service chain |
| GET    | /does-support | `nf`: network function name        | Tells whether the server supports specified network function                                     |
| POST   | /start        | `data`: `.json` configuration file | Starts a slice running the specified service chain and responds with MAC address of the slice    |
| GET    | /supported    | none                               | Lists all network functions supported by server                                                  |

#### Configuration File Format

Configuration files should be written in JSON format. Each file represents a
directed graph, which in turn is parsed into a service chain by the server. For
instance, for a service chain of Firewall -> Deep Packet Inspection -> Network
Address Translation, the configuration file would be as follows:

```json
[{ "name": "firewall" }, { "name": "dpi" }, { "name": "nat" }]
```

That is, the file should be an array of objects, where each object represents a
VNF and the order of the objects in the array represents the order of the
service chain, _i.e._ the first object will take input from clients and output
to the second object, which outputs to the third, and so on.

#### Supported NFs

The server supports NFs which have the following function signature:

```rust
pub fn nf_name<T>(parent: T) -> CompositionBatch
where
    T: Batch<Header = NullHeader> + 'static
{
    ...
}
```

(In other words, each NF should take a singular packet batch argument.)

**TODO** in the future, it will support functions which have additional
arguments.

Note: at time of writing, no new NFs have been added to those available in the
NetBricks repository.

#### Writing New NFs

To write a new NF supported by the server, make sure it abides by the following
requirements:

- The NF should live, as other NFs do, in `NetBricks/test/<NF name>`. More
  specifically, the directory structure should be as follows:

```shell
NetBricks/
|
...
|-- test/<NF name>
|   |-- Cargo.toml
|   |-- src/
|   |   `-- nf.rs
|   ...
|
...
```

- The above output is the minimal required, and the names should be exactly as
  listed. Additionally, the name of the actual NF in the Rust source file
  (`nf.rs`) should be the same as the subdirectory name in `test/` (_i.e._
  `<NF name>`).

- Even if the NF is not run outside of its service chain, ensure that it has
  a `Cargo.toml`, because external dependencies and authorship information are
  pulled from it when the server creates the `Cargo.toml` of the whole service
  chain.

## Benchmarking

⚠️ This section is a work-in-progress! ⚠️

Open vSwitch, Pktgen, and DPDK are used to benchmark performance. For
compatability, the most recent versions of the libraries cannot be used (see
[this link](https://mail.openvswitch.org/pipermail/ovs-discuss/2017-August/045173.html)).
As such, in the report, results are based on the following versions:

- [Open vSwitch v2.7.2](https://www.openvswitch.org/releases/openvswitch-2.7.6.tar.gz)
- [DPDK v16.11.9](http://fast.dpdk.org/rel/dpdk-16.11.9.tar.xz)
- [Pktgen v3.1.1](https://git.dpdk.org/apps/pktgen-dpdk/snapshot/pktgen-3.1.1.tar.gz)

A script is provided in `benchmarking_setup.sh` to help automate the
installation of all requisites for benchmarking.

After running the setup script, the Docker `cpsc-490-benchmark` image can be
built (or simply pulled from Docker hub). To build it, use the `Dockerfile` in
`docker/benchmark/`.

Afterward, benchmarking can begin. The basic flow is that packets should move
from a container running Pktgen to a container running a VNF service chain,
routed over Open vSwitch.

Thus, first start the containers:

- For the VNF chain,

  - Start the container with

  ```shell
  docker run -it --rm --privileged --network=host -w /opt/cpsc-490/NetBricks \
      -v $(pwd):/opt/cpsc-490 \
      -v /lib/modules:/lib/modules \
      -v /usr/src:/usr/src \
      -v /dev/hugepages:/dev/hugepages \
      -v /usr/local/var/run/openvswitch:/var/run/openvswitch seankwalker/cpsc-490-dev /bin/bash
  ```

  export DPDK_PARAMS="-c 0x2 --master-lcore 1 -n 1 -m 512 --file-prefix testpmd --no-pci --vdev=virtio_user2,mac=00:00:00:00:00:02,path=/var/run/openvswitch/vhost-user2"

  export TESTPMD_PARAMS="--burst=64 -i --disable-hw-vlan --txd=2048 --rxd=2048 --forward-mode=io --auto-start --coremask=0x2"

  testpmd $DPDK_PARAMS -- $TESTPMD_PARAMS

* For the Pktgen container:

  - Start the container with

  ```shell
  docker run --network=host -tiv /mnt/huge:/mnt/huge \
        -v /usr/local/var/run/openvswitch:/var/run/openvswitch \
        --privileged seankwalker/cpsc-490-benchmark
  ```

  - Set the `DPDK_PARAMS` environment variable to the following:

  ```shell
  export DPDK_PARAMS="-c 0x1 --master-lcore 0 -n 1 -m 512 --file-prefix pktgen --no-pci --vdev=virtio_user1,mac=00:00:00:00:00:01,path=/var/run/openvswitch/vhost-user1"
  ```

  In words, this sets the container to use 4 containers (coremask of `0xf` ->
  `0b1111` meaning cores 0, 1, 2, 3 are enabled), using core 3 as the master
  core, with one memory channel, 512MB of memory, and tells pktgen to not bother
  looking for physical devices on the bus to send packets over.

  - Set the `PKTGEN_PARAMS` environment variable to the following:

  ```shell
  export PKTGEN_PARAMS="-T -P -m '0.0'"
  ```

  Where `-T` enables colored output, `-P` enables promiscuous mode on all ports,
  and `-m` maps port 0 to core 0.

  Finally, run

  ```shell
  $PKTGEN_DIR/app/app/$DPDK_BUILD/pktgen $DPDK_PARAMS -- $PKTGEN_PARAMS
  ```

## Acknowledgements

I'd like to extend my thanks to the authors of NetBricks and the folks at
Comcast's Occam Engineering team for creating the basis for my project.

I'd also like to express my sincere gratitute to my thesis advisor, Professor
Y. Richard Yang, for his consistent guidance, optimism, and insight throughout
the process of creating this project.

Lastly, thanks to Jacob Hillman, who has been a
kind friend, supportive peer, and wonderful person to know throughout our
collaborations on related work.
