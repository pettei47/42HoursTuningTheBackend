FROM mysql:8.0

COPY ./custom.conf /etc/mysql/conf.d/mysql.cnf
COPY ./logs/emptyfile.log /var/log/mysql/slow.log

CMD ["mysqld"]
