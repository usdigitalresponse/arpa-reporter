#!/bin/bash

set -o errexit

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Import .env variables if not already defined.
DOTENV="$DIR/../../.env"
source /dev/stdin <<DONE
$(grep -v '^#' $DOTENV | sed -E 's|^(.+)=(.*)|: ${\1=\2}; export \1|g')
DONE

export DEVDBNAME="${POSTGRES_URL##*/}"

# add `_test` to POSTGRES_URL if it's not already there
if [ ${POSTGRES_URL: -5} != "_test" ]
then
  export POSTGRES_URL="${POSTGRES_URL}_test"
fi

export DATA_DIR=`dirname $0`/mocha_uploads

$DIR/reset-db.sh

if [ $# -gt 0 ]; then
  mocha --require=`dirname $0`/mocha_init.js $*
else
  mocha --require=`dirname $0`/mocha_init.js 'tests/server/**/*.spec.js'
fi

