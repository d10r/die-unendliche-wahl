#!/bin/bash

set -e
set -u

# this can be used from a cronjob. E.g. for starting a new round every midnight:
# 0 0 * * *  start-next-round.sh

node main.js --config processResult

echo

node main.js --config startNewRound

