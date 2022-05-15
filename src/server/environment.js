
const { join, resolve } = require('path')

const VERBOSE = Boolean(process.env.VERBOSE)

const UPLOAD_DIR = resolve(process.env.UPLOAD_DIRECTORY)

const SRC_DIR = resolve(join(__dirname, '..'))
const SERVER_DATA_DIR = join(SRC_DIR, 'server', 'data')

const EMPTY_TEMPLATE_NAME = 'ARPA SFRF Reporting Workbook v20220419.xlsm'

module.exports = {
  UPLOAD_DIR,
  SRC_DIR,
  SERVER_DATA_DIR,
  EMPTY_TEMPLATE_NAME,
  VERBOSE
}
