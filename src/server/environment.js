const { join, resolve } = require('path')

const VERBOSE = Boolean(process.env.VERBOSE)

const DB_URL = process.env.POSTGRES_URL

const DATA_DIR = resolve(process.env.DATA_DIR)
const UPLOAD_DIR = join(DATA_DIR, 'uploads')

const SRC_DIR = resolve(join(__dirname, '..'))
const SERVER_DATA_DIR = join(SRC_DIR, 'server', 'data')

const EMPTY_TEMPLATE_NAME = 'ARPA SFRF Reporting Workbook v20220516.xlsm'

module.exports = {
  DATA_DIR,
  UPLOAD_DIR,
  SRC_DIR,
  SERVER_DATA_DIR,
  EMPTY_TEMPLATE_NAME,
  DB_URL,
  VERBOSE
}
