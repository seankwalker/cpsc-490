# build DPDK from source

cd $DPDK_DIR
make config O=$DPDK_BUILD T=$DPDK_BUILD
cd $DPDK_BUILD
make -j8