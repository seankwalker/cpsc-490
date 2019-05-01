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
      0000:00:08.0 'Virtio network device 1000' if=enp0s8 unused=uio_pci_generic
      0000:00:09.0 'Virtio network device 1000' if=enp0s9 unused=uio_pci_generic
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

3.  After running the above, traffic should run from the generator to the NF
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

The server dynamically spins up containers which run VNF service chains
described by configuration files passed to its single API endpoint, `/start`.

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

## Acknowledgements

I'd like to extend my thanks to the authors of NetBricks and the folks at
Comcast's Occam Engineering team for creating the basis for my project.

I'd also like to express my sincere gratitute to my thesis advisor, Professor
Y. Richard Yang, for his consistent guidance, optimism, and insight throughout
the process of creating this project.

Lastly, thanks to Jacob Hillman, who has been a
kind friend, supportive peer, and wonderful person to know throughout our
collaborations on related work.
