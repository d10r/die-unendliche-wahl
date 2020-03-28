## About

This directory contains admin tools needed for
* contract compilation (DEPRECATED)
* contract deployment
* contract configuration (e.g. starting election, processing result)

Run `npm install` to install dependencies.  
Then create `config.json` (see `config.json.example`).  
The configured RPC node needs to have an unlocked and funded account set.

After running the install script, execute ```node main.js --help``` in order to see available actions.

### Contract Compilation (DEPRECATED)

Contract source files are in `../blockchain/contracts`.  
Ethereum nodes used to support an RPC call for compiling contracts. That RPC call isn't implemented anymore in 2020.

### Contract Deployment

`node main.js --create <election name>` deploys an Election contract, using the abi and bytecode in `generated/compiled_contract.json`.  
The address used for deployment is set as admin address in the contract, it has exclusive permission to start and stop election rounds.

### Contract configuration

The Election contract is designed specifically for this demo use case of an arbitrary number of election rounds.  
The contract is initialized with the virtual election closed. In order to start, do
```
node main.js --config startElection
```

The election DApp assumes a round length of 1 hour. Thus the provided bash script `start-next-round.sh` should be executed once an hour, e.g. by a cronjob. 

### Gas Distributor

`http-gas-distributor.js` is a workaround to Ethereum contracts not yet being able to pay for transactions themselves.
The web application needs it to get self created accounts funded in order to be able to execute voting transactions.

Run it with ```node http-as-distributor.js```.

This scripts will connect to the Ethereum node configured in config.json and use the first account.
The account needs to be unlocked and funded. Thus this should be the admin node, running on the same host.
