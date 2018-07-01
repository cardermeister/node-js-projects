#!/bin/bash
CONST_PWD=$(pwd)
for f in sale/*; do
    cd $CONST_PWD/${f}
    #git pull
done

cd $CONST_PWD/forever
for f in headless*.log; do
    echo "" > $f
done