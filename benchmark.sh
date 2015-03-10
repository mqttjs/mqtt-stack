#!/bin/sh

export PORT=5000

node example.js &
node benchmark/receive.js &
node benchmark/send.js
