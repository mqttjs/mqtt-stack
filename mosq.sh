#!/bin/sh

echo "===== LAUNCHING MOSQUITTO ====="

mosquitto -c /usr/local/etc/mosquitto/mosquitto.conf -p 5000 &
sleep 2

echo "===== START TESTS ====="

export PORT=5000
./node_modules/.bin/mocha --recursive --reporter list test/acceptance/**/*.js

echo "===== STOPPING MOSQUITTO ====="

killall mosquitto
