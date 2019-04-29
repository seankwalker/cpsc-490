#
# setup.sh
#
# Sean Walker
# CPSC 490
# One-time dev environment setup script.
#
# n.b. make sure Vagrant and VirtualBox are installed before running this script
#

export VAGRANT_CWD=vagrant

vagrant plugin install vagrant-disksize vagrant-reload

git clone git@github.com:seankwalker/NetBricks.git

# if you prefer to use HTTPS, use the following lines instead of the above two:
# git clone https://github.com/seankwalker/utils
# git clone https://github.com/seankwalker/NetBricks

vagrant up