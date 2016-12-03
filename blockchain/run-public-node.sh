#!/bin/bash

set -e
set -u

DATADIR=testnet-public
GENESIS_FILE=testnet_genesis.json

if [[ !  `which geth` ]]; then
    echo "### geth not found!"
    echo "make sure you have geth (go-ethereum) installed and in PATH before executing this. See Readme"
    echo "you may also use another ethereum client, but then this script is not for you"
    exit 1
fi

if [[ ! -d $DATADIR ]]; then
    if [[ ! -f $GENESIS_FILE ]]; then
	echo "## genesis file $GENESIS_FILE not found"
	exit 2
    fi

    echo "initialiting public node in $DATADIR..."
    geth --datadir $DATADIR init $GENESIS_FILE
    echo
fi

echo "starting geth..."
# TODO: start in background?
geth --datadir $DATADIR --networkid 3 --fast --rpc --rpcaddr 0.0.0.0 --rpccorsdomain "*" --rpcport 2016 --port 32016 --identity dieunendlichewahl-public

# This node is publicly accessible, thus no funded account should be unlocked.
# Doesn't need an account, because the connecting clients have their own account handling.
