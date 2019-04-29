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

`server/` contains code related to the server which should be running on a
routing/load-balancing middlebox which communicates with the orchestrator. In
particular, this server's job is to receive configuration files from the
orchestrator. Each config file, written in the JSON format, is parsed as a
directed graph defining a VNF service chain. The server then either routes the
traffic specified by the server to an already-existing container on some other
middlebox which is running the specified service chain (and has enough capacity
to serve another UE) or spins up a new container with the service chain and
routes the traffic there.

`vagrant/` contains configuration files and scripts used by Vagrant.

## Getting Started

### Building

NetBricks requires a number of hardware and software prerequisites, which is
linked in the README of the repository. Comcast's Occam team's fork has a
variety of open source tools and code they use to streamline the development
process (it also allows building and running the code on OSX).

More detailed instructions can be found in the individual repos, but the vital
steps are outlined here (following them will be sufficient to get up and
running).

#### Dev Environment Setup

Docker, Vagrant and VirtualBox are used to emulate an Ubuntu Linux environment
with the necessary devices, libraries, and software to be used for building and
developing NetBricks.

A script which automates steps 2-5 is available in `setup.sh`.

1. Download and install [Docker](https://www.docker.com/get-started),
   [Vagrant](https://www.vagrantup.com/downloads.html) and
   [VirtualBox](https://www.virtualbox.org/wiki/Downloads).

2. Install two Vagrant plugins: `vagrant-disksize` and `vagrant-reload`, via
   `vagrant plugin install`.

3. Clone the following repository:

   - `git@github.com:seankwalker/NetBricks`

The dev VM can now be booted via

`vagrant up`

Once finished with the VM, it can be shut down via

`vagrant halt`

#### Using Vagrant and Docker

Vagrant can be configured by editing `Vagrantfile`, if so desired.

The VM can now be accessed by running `vagrant ssh`. `ssh` will enter in the
same directory, but running in the Ubuntu VM.

From there, run the `docker_init.sh` script to pull the latest image from
`seankwalker/dpdk` and start it in a container.

The Docker container gives us an environment where NetBricks can be successfully
built. The container should start in the `NetBricks` directory, so simply run
`./build.sh build` to build NetBricks.

## Running Network Functions

Once NetBricks is built, any files using it as a dependency can now be run.
Following the convention from the original repository, network functions (NFs)
live in the `test` directory. There are several ways to run any NF,
but the most direct and simple way is via `cargo`, Rust's package manager.

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

`./build.sh run maglev`

New NFs (i.e. those not in the original NetBricks release) have been written to
take in sample packet data as a way of testing. Thus, they should be run with
specific flags. In particular, each NF should have a `check.sh` script in its
subdirectory, which should specify the options to run with.

## Acknowledgements

I'd like to extend my thanks to the authors of NetBricks and the folks at
Comcast's Occam Engineering team for creating the basis for my project.

I'd also like to express my sincere gratitute to my thesis advisor, Professor
Y. Richard Yang, for his consistent guidance, optimism, and insight throughout
the process of creating this project.

Lastly, thanks to Jacob Hillman, who has been a
kind friend, supportive peer, and wonderful person to know throughout our
collaborations on related work.
