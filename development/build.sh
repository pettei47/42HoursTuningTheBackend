#!/bin/bash

# ==================================
# ビルドスクリプト。
# ==================================

# web画面の変更を反映したい場合、コメントアウトを外す。
# (cd ./frontend && npm run build)

test="docker-compose-test.yaml"

docker-compose down --rmi all
docker-compose -f $test down --rmi all

if [ "$1" != "" ]; then
	echo "slow_query_log mode start"
	docker-compose -f $test build --no-cache
	docker-compose -f $test up -d
else
	echo "normal test mode start"
	docker-compose build --no-cache
	docker-compose up -d
fi
