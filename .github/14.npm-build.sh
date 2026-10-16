#!/bin/bash

rm -rf ../.angular/
rm -rf ../dist/

cd $(git rev-parse --show-toplevel)

npm run build:prod


