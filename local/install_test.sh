#!/bin/bash

bash cpMysqlFile.sh
docker-compose -f docker-compose-local.yaml down --rmi all
docker-compose -f docker-compose-local.yaml build --no-cache
docker-compose -f docker-compose-local.yaml up
