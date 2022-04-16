#!/bin/bash

# ==================================
# ビルドスクリプト。
# ==================================

# web画面の変更を反映したい場合、コメントアウトを外す。
# (cd ./frontend && npm run build)


if [ "$1" != "" ]; then
    test="docker-compose-test.yaml"
	echo "slow_query_log mode start"
	docker-compose -f $test down --rmi all
	docker-compose -f $test build --no-cache
	docker-compose -f $test up -d
else
	echo "normal test mode start"
	docker-compose down --rmi all
	docker-compose build --no-cache
	docker-compose up -d
fi
