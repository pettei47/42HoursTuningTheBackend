FROM mysql:8.0

COPY ./custom.conf /etc/mysql/conf.d/mysql.cnf

# RUN apt-get update && apt-get install -y wget
# RUN wget https://github.com/percona/percona-toolkit/archive/3.0.5-test.tar.gz \
# 	&& tar zxvf 3.0.5-test.tar.gz \
# 	&& ./percona-toolkit-3.0.5-test/bin/pt-query-digest --version \
# 	&& mv ./percona-toolkit-3.0.5-test/bin/pt-query-digest /usr/local/bin/pt-query-digest

CMD ["mysqld"]
