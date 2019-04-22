#
# docker_init.sh
#
# Sean Walker
# CPSC 490
# Enter a Docker container for building and running NetBricks.
#

IMAGE=seankwalker/cpsc-490-sandbox:latest

# ensure latest version of sandbox image
docker pull $IMAGE

# run the sandbox with access to the NetBricks source
docker run -it --rm --privileged --network=host -w /opt/NetBricks \
        -v $(pwd):/opt/NetBricks $IMAGE /bin/bash