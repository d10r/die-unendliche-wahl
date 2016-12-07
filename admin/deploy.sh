#!/bin/bash

set -u
set -e

node main.js --compile ../blockchain/contracts/blockvote.sol --create demo
node main.js --config startElection
