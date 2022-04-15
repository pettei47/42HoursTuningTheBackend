FROM mysql:8.0

COPY ./custom.conf /etc/mysql/conf.d/mysql.cnf

CMD ["mysqld"]
CMD ["SET GLOBAL log_slow_queries = 1;"]