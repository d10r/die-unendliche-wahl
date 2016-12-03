#!/bin/bash

set -e
set -u

DATADIR=testnet-admin
ACCOUNT=$(geth --datadir $DATADIR account list | head -n 1 | sed 's/.*{\(.*\)}.*/\1/')
BALANCE="$(geth --exec "web3.fromWei(eth.getBalance(eth.accounts[0]))" attach $DATADIR/geth.ipc)"
echo "balance of account $ACCOUNT : $BALANCE Ether"

if [[ $BALANCE == 0 ]]; then
	echo "if you don't like empty pockets, run the admin node with argument --mine (give it some hours)"
fi
