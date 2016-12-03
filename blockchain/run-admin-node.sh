#!/bin/bash

set -e
set -u

DATADIR=testnet-admin
GENESIS_FILE=testnet_genesis.json

MINING_ARGS=""
if (($# == 1)) && [[ $1 == "--mine" ]]; then
    echo "mining enabled"
    MINING_ARGS="--mine --minerthreads 1"
fi

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

    echo "initialiting admin node in $DATADIR..."
    geth --datadir $DATADIR init $GENESIS_FILE
    echo
fi

ACCOUNT=$(geth --datadir $DATADIR account list | head -n 1 | sed 's/.*{\(.*\)}.*/\1/')
if [[ ! $ACCOUNT ]]; then
    echo "creating admin account..."
    echo "Use a good password if you don't want it to be hacked!"
    geth --datadir $DATADIR account new
    # get the address of the first account in list
    ACCOUNT=$(geth --datadir $DATADIR account list | head -n 1 | sed 's/.*{\(.*\)}.*/\1/')
    #echo $NEW_ACCOUNT > $ACCOUNT_FILE
    echo "If you don't want to manually enter the password in future, save it to a file named ""$ACCOUNT.password"" in this directory"
    echo
fi

    
PASSWORD_ARG=""
if [[ -f $ACCOUNT.password ]]; then
    PASSWORD_ARG="--password $ACCOUNT.password"
else
    echo "Reminder: If you don't want to manually enter the password in future, save it to a file named ""$ACCOUNT.password"" in this directory"
fi

echo "starting geth..."
geth --datadir $DATADIR --networkid 3 --fast --rpc --rpcport 2017 --rpccorsdomain "*" --port 32017 --identity dieunendlichewahl-admin $MINING_ARGS --etherbase $ACCOUNT --unlock $ACCOUNT $PASSWORD_ARG

# TODO: start in background? Something like
#start-stop-daemon --start --background --exec $(which geth) -- --datadir $(pwd)/$DATADIR --networkid 3 ...
# but that breaks manual password input. Let the user handle it, e.g. with screen.

# The admin (first) account is left unlocked in order to give the admin scripts access. Since rpc listens to localhost only, that's safe as long as only trusted users have shell access.
# Mining is enabled here in order to earn some Ether. Can be disabled once the admin account has enough funds.
# Note that the mining flag, when used for the first time, triggers creation of the DAG which will take quite a while and consume a considerable amount of storage (> 1GB)
