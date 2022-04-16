#!/bin/bash

# ===========================
# localMysql用に、一部ファイルをdevelopmentからコピーする
# ===========================

cp ../development/mysql/sql/V0.sql ./localMysql/sql/
cp ../development/mysql/custom.conf ./localMysql/custom.conf
cp ../development/mysql/Dockerfile ./localMysql/Dockerfile
cp ../development/nginx/Dockerfile ./localNginx/Dockerfile
