#!/bin/bash

MAIN="node main.js"

cnt=0

while true; do
	cnt=$((cnt+1))
	echo "starting iteration $cnt"
	# for some reason, reset doesn't work
	#$MAIN --config reset
	# thus creating a new contract for every iteration
	echo "creating contract $cnt"
	$MAIN --create demo

	echo "starting election"
	$MAIN --config startElection
	sleep 7200

	echo "stopping election"
	$MAIN --config stopElection
	echo "processing result..."
	$MAIN --config processResult
	sleep 600
	echo
	echo
done

