# Blockchain

This directory contains tools for setting up a node for the Ethereum blockchain.
First, you need to install the go-ethereum client. See https://www.ethereum.org/cli.

Once the geth command is ready, you can sync with the testnet chain.
Run ```./run-admin-node.sh``` in order to create the admin node.
```./run-admin-node.sh``` creates the public node which opens a publicly accessible RPC interface.

There's a dedicated admin node because having a node with permanently unlocked account makes it much easier to execute admin tasks.
Having the public node with unlocked account would make it very easy to steal funds from the admin account.
For testnet use that wouldn't really be an issue, but still...


It would be trivial to reconfigure the nodes for the live blockchain. However transactions would then cost _real_ money.