#!/bin/sh

export PORT=5000

node example.js &
sleep 1
node benchmark/receive.js &
sleep 1
node benchmark/send.js
