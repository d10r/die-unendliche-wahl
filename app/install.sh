#!/bin/bash

set -e
set -u

echo "npm install"
npm install

echo "jspm install"
jspm install

echo
echo "all done"

if [[ -f config/config.json ]]; then
	echo
	echo "!!!"
	echo "Finally, you need to create a config file in"
	echo "config/config.json"
	echo "See example file"
	echo "!!!"
fi
