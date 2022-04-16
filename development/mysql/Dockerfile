FROM mysql:8.0

COPY ./custom.conf /etc/mysql/conf.d/mysql.cnf

RUN apt-get update && apt-get install -y wget
RUN wget https://github.com/percona/percona-toolkit/archive/3.0.5-test.tar.gz \
	&& tar zxvf 3.0.5-test.tar.gz \
	&& ./percona-toolkit-3.0.5-test/bin/pt-query-digest --version \
	&& mv ./percona-toolkit-3.0.5-test/bin/pt-query-digest /usr/local/bin/pt-query-digest

RUN service mysql start \
		&& mysql -e "set global long_query_time = 0.5;" \
		&& mysql -e "set global slow_query_log = 1;" \
		&& mysql -e "set global slow_query_log_file = '/tmp/slow.log';" \
		&& mysql -e "set @@global.log_queries_not_using_indexes = 1;"

CMD ["mysqld"]
