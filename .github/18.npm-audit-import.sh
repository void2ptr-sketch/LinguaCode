#!/bin/bash

cd $(git rev-parse --show-toplevel)

npm run check:imports
