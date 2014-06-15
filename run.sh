#!/bin/sh

node --version | tee log
node tester.js | tee result | expand -t16
