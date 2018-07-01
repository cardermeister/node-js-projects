#!/bin/bash
CONST_PWD="/home/card/node-js-projects"
cd $CONST_PWD/sale
for f in *; do
    cd ${f}
    git pull
    cd ..
done
