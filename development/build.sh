#!/bin/bash

# ==================================
# ビルドスクリプト。
# ==================================

# web画面の変更を反映したい場合、コメントアウトを外す。
# (cd ./frontend && npm run build)


if [ $1 -eq "test" ]; then
    test="docker-compose-test.yaml"
else
    test=""
fi

docker-compose $test down --rmi all
docker-compose $test build --no-cache
docker-compose $test up -d
