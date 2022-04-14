
const { tmpdir } = require('os')
const { mkdtempSync } = require('fs')
const { join } = require('path')

function tempDataDir () {
  return mkdtempSync(join(tmpdir(), 'arpa-data-'))
}

const DATA_DIR = process.env.DATA_DIR || tempDataDir()
const UPLOAD_DIR = join(DATA_DIR, 'uploads')
const ARPA_REPORTS_DIR = join(DATA_DIR, 'arpa_reports')

module.exports = {
  DATA_DIR,
  UPLOAD_DIR,
  ARPA_REPORTS_DIR
}
