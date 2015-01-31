#!/bin/sh

mosquitto -c mosq.conf -p 5000 &
sleep 2

export PORT=5000
./node_modules/.bin/mocha --recursive --reporter list test/acceptance/**/*.js

killall mosquitto
