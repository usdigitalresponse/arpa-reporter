#!/bin/bash

set -o pipefail
set -o errexit
set -o nounset

dbconn=${POSTGRES_URL#*//}  # from postgres://user:pass@host/dbname -> user:pass@host/dbname
userpass=${dbconn%@*}       # 'user:pass'
hostdbname=${dbconn#*@}         # host/dbname
if [ $userpass == $hostdbname ]
then
  userpass='postgres'
fi

username=${userpass%:*}
password=${userpass#*:}

host=${hostdbname%/*}
dbname=${hostdbname#*/}

hostname=${host%:*}
hostport=${host#*:}
if [ $hostport == $hostname ]
then
  hostport="5432"
fi

echo Using database $dbname

mkdir -p $DATA_DIR
rm -rf $DATA_DIR/*

set -x
if [ $DEVDBNAME == $dbname ]
then
  PGPASSWORD=$password psql -h $hostname -p $hostport -U $username -w ${DEVDBNAME} -c "DROP SCHEMA public CASCADE"
  PGPASSWORD=$password psql -h $hostname -p $hostport -U $username -w ${DEVDBNAME} -c "CREATE SCHEMA public"
else
  PGPASSWORD=$password psql -h $hostname -p $hostport -U $username -w ${DEVDBNAME} -c "DROP DATABASE IF EXISTS $dbname"
  PGPASSWORD=$password psql -h $hostname -p $hostport -U postgres -w ${DEVDBNAME} -c "CREATE DATABASE $dbname"
fi

yarn knex migrate:latest
yarn knex --knexfile tests/server/knexfile.js seed:run
