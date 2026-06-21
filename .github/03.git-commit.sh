#!/bin/bash

branch=$(git branch --show-current)
if [ -z "$branch" ]; then
  branch=$(git rev-parse --short HEAD)
fi

git commit -a -m "[${branch}] "
