# CPSC 490 (Project Title TBD)

This repository contains code relevant to my undergraduate thesis.

## Acknowledgements

My thesis builds on top of [NetBricks](http://netbricks.io/), a framework for virtual network function (VNF) development originally created by Aurojit Panda, Sangjin Han, Keon Jang, Melvin Walls, Sylvia Ratnasamy, and Scott Shenker.

Because at the time of development the [original NetBricks source code](https://github.com/netsys/netbricks) was fraught with build errors and to speed up development, I used a fork of the original code which was developed by Comcast's Occam Engineering team, available [here](https://github.com/williamofockham/NetBricks).

## Getting Started

### Building

NetBricks requires a number of hardware and software prerequisites, which you can find linked in the README of the repository. Comcast's Occam team's fork has a variety of open source tools and code they use to streamline the development process (it also allows building and running the code on OSX).

You can find more detailed instructions in the individual repos, but I'll outline the vital steps here.

#### Dev Environment Setup

We utilize Docker, Vagrant and VirtualBox to emulate an Ubuntu Linux environment to be used for development.

A script which will do steps 2-5 automatically is available in `setup.sh`.

1. Download and install [Docker](https://www.docker.com/get-started), [Vagrant](https://www.vagrantup.com/downloads.html) and [VirtualBox](https://www.virtualbox.org/wiki/Downloads).

2. Install two Vagrant plugins: `vagrant-disksize` and `vagrant-reload`, via `vagrant plugin install`.

3. Clone the following repositories:

   - `git@github.com:seankwalker/utils`
   - `git@github.com:seankwalker/NetBricks`

4. Create a symlink to Vagrant's configuration file in the parent directory, i.e. `ln -s utils/Vagrantfile`

We can now boot our dev VM via

`vagrant up`

After you're finished, you can stop the VM via

`vagrant halt`

#### Using Vagrant and Docker

You can now access the VM by running `vagrant ssh`. This will put you in the same directory, but running in the Ubuntu VM.

From there, run the `docker_init.sh` script to pull the latest container and enter it.

The Docker container gives us an environment where NetBricks can be successfully built. Thus, from here, simply run `make build` to build NetBricks.
