#!/bin/bash

set -u
set -e

node main.js --compile ../blockchain/contracts/election.sol --create demo
node main.js --config startElection
