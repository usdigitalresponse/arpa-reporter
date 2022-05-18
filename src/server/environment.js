
const { tmpdir } = require('os')
const { mkdtempSync } = require('fs')
const { join, resolve } = require('path')

function tempDataDir () {
  return mkdtempSync(join(tmpdir(), 'arpa-data-'))
}

const VERBOSE = Boolean(process.env.VERBOSE)

const DATA_DIR = resolve(process.env.DATA_DIR || tempDataDir())
const UPLOAD_DIR = join(DATA_DIR, 'uploads')
const ARPA_REPORTS_DIR = join(DATA_DIR, 'arpa_reports')

const SRC_DIR = resolve(join(__dirname, '..'))
const SERVER_DATA_DIR = join(SRC_DIR, 'server', 'data')

const EMPTY_TEMPLATE_NAME = 'ARPA SFRF Reporting Workbook v20220516.xlsm'

module.exports = {
  DATA_DIR,
  UPLOAD_DIR,
  ARPA_REPORTS_DIR,
  SRC_DIR,
  SERVER_DATA_DIR,
  EMPTY_TEMPLATE_NAME,
  VERBOSE
}
