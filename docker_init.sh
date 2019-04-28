#
# docker_init.sh
#
# Sean Walker
# CPSC 490
# Enter a Docker container for building and running NetBricks.
#

# IMAGE=seankwalker/dpdk:latest
IMAGE=seankwalker/dpdk

# ensure latest version of sandbox image
docker pull $IMAGE

# run the sandbox with access to the NetBricks source
docker run -it --rm --privileged --network=host -w /opt/cpsc-490/NetBricks \
        -v $(pwd):/opt/cpsc-490 \
        -v /lib/modules:/lib/modules \
        -v /usr/src:/usr/src \
        -v /dev/hugepages:/dev/hugepages $IMAGE /bin/bash
