#!/bin/bash

branch=$(git branch --show-current)
if [ -z "$branch" ]; then
  branch=$(git rev-parse --short HEAD)
fi

git push origin ${branch}

