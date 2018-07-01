#!/bin/bash
CONST_PWD="/home/card/node-js-projects"

cd $CONST_PWD/forever
for f in headless*.log; do
    echo "" > $f
done