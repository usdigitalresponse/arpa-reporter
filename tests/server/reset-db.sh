#!/bin/bash
set -eo pipefail

dbconn=${POSTGRES_URL#*//}  # from postgres://user:pass@host/dbname -> user:pass@host/dbname
userpass=${dbconn%@*}       # 'user:pass'
hostdbname=${dbconn#*@}         # host/dbname

username=${userpass%:*}
password=${userpass#*:}

host=${hostdbname%/*}
dbname=${hostdbname#*/}

echo Using database $dbname

mkdir -p $UPLOAD_DIRECTORY
rm -rf $UPLOAD_DIRECTORY/*

PGPASSWORD=$password psql -h $host -U $username -w ${DEVDBNAME} -c "DROP DATABASE IF EXISTS $dbname"
PGPASSWORD=$password psql -h localhost -U postgres -w ${DEVDBNAME} -c "CREATE DATABASE $dbname"

yarn knex migrate:latest
yarn knex --knexfile tests/server/knexfile.js seed:run
