#!/bin/bash

set -e
set -u

npm install

echo
echo "all done"

if [[ ! -f config/config.json ]]; then
        echo
        echo "!!!"
        echo "Finally, you need to create a config file in"
        echo "config.json"
        echo "See example file"
        echo "!!!"
fi

