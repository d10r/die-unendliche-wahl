#!/bin/bash

set -e
set -u

# This uses the js based testrpc Ethereum client.
# It's made specifically for development.
# It creates a new chain from scratch and has a very low blocktime, leading to near instant transaction execution.
# It can create and fund accounts on startup if configured so via parameters.
# See https://github.com/ethereumjs/testrpc


if [[ !  `which testrpc` ]]; then
	echo "### testrpc is not installed. Install with:"
	echo "npm install -g testrpc"
	exit 1
fi

if pidof geth > /dev/null; then
	if [[ $# == 1 ]] && [[ $1 == "--force" ]]; then
		echo "Parameter --force used. Starting alongside geth (will fail if same port used)..."
	else
		echo "At least one instance of geth is running. This is probably not what you want."
		echo "If your really want to run testrpc in parallel, run this script with parameter --force"
		exit 2
	fi
fi

PORT=2016
echo "Starting testrpc on port $PORT, creating one funded account"
echo "Remember that you need to re-deploy contract(s) every time you start this dev chain"
echo "You may also need to edit amin/config.json and restart http-gas-distributor"
testrpc -a 1 -p $PORT
