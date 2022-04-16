FROM mysql:8.0

COPY ./custom.conf /etc/mysql/conf.d/mysql.cnf
COPY ./logs/emptyfile.log /var/log/mysql/slow.log
COPY ./sql/V0.sql /docker-entrypoint-initdb.d/1_init.sql
COPY ./sql/2_loadTestData.sql /docker-entrypoint-initdb.d/
COPY ./data/* /docker-entrypoint-initdb.d/

RUN apt-get update && apt-get install -y wget
RUN wget https://github.com/percona/percona-toolkit/archive/3.0.5-test.tar.gz \
	&& tar zxvf 3.0.5-test.tar.gz \
	&& ./percona-toolkit-3.0.5-test/bin/pt-query-digest --version \
	&& mv ./percona-toolkit-3.0.5-test/bin/pt-query-digest /usr/local/bin/pt-query-digest

CMD ["mysqld"]
