# Admin

This directory contains admin tools needed for
* contract compilation
* contract deployment
* contract configuration (e.g. starting election, processing result)

After running the install script, execute ```node main.js --help``` in order to see available actions.
Contract source files are in @../blockchain/contracts@

@http-gas-distributor.js@ is a workaround to Ethereum contracts not yet being able to pay for transactions themselves.
The web application needs it to get self created accounts funded in order to be able to execute voting transactions.

Run it with ```node http-as-distributor.js```.

This scripts will connect to the Ethereum node configured in config.json and use the first account.
The account needs to be unlocked and funded. Thus this should be the admin node, running on the same host.