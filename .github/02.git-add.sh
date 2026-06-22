#!/bin/bash

cd $(git rev-parse --show-toplevel)

git add -A .

git status

