#!/bin/bash

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get upgrade -y
apt-get install -y linux-image-4.15.0-15-generic