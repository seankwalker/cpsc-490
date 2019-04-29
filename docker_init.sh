#
# docker_init.sh
#
# Sean Walker
# CPSC 490
# Enter a Docker container for building and running NetBricks.
#

IMAGE=seankwalker/cpsc-490-dev

# ensure latest version of sandbox image
echo "pulling latest version of $IMAGE..."
docker pull $IMAGE

# run container if specified, otherwise simply download it
if [ "$1" = "run" ]; then
    echo "running container..."
    # run the sandbox with access to the NetBricks source
    docker run -it --rm --privileged --network=host -w /opt/cpsc-490/NetBricks \
        -v $(pwd):/opt/cpsc-490 \
        -v /lib/modules:/lib/modules \
        -v /usr/src:/usr/src \
        -v /dev/hugepages:/dev/hugepages $IMAGE /bin/bash
fi
