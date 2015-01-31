#!/bin/sh

mosquitto -c mosq.conf -p 5000 &
sleep 2

export PORT=5000
export NORMAL_SPEED=true
export EXTERN=true
./node_modules/.bin/mocha --recursive --reporter list test/acceptance

killall mosquitto
