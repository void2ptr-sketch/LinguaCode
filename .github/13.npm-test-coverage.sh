#!/bin/bash

cd $(git rev-parse --show-toplevel)

#npm run test:coverage
ng test --coverage --coverage-reporters=text



