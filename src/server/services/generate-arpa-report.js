
const path = require('path')
const { mkdir, rmdir, open, readdir } = require('fs/promises')
const moment = require('moment')

const { applicationSettings } = require('../db/settings')
const { ARPA_REPORTS_DIR } = require('../environment')

async function generateReportName (periodId) {
  const now = moment().utc()
  const { title: state } = await applicationSettings()

  const filename = [
    state.replace(/ /g, '-'),
    'Period',
    periodId,
    'ARPA-Treasury-Report-generated',
    now.format('YYYY-MM-DDTHH:mm:ss')
  ].join('-')

  return filename
}

async function generateDummyData (periodId) {
  return [
    ['col1', 'col2', 'col3'],
    ['val1', 1, '1970-01-01'],
    ['val2', 2, '1970-01-02']
  ]
}

async function writeFile (path, contents) {
  return open(path, 'w')
    .then(handle => handle.writeFile(contents)
      .then(() => handle.close())
    )
}

async function generateReport (periodId) {
  // create a directory for the report
  const dirName = path.join(
    ARPA_REPORTS_DIR,
    periodId.toString(),
    (await generateReportName(periodId))
  )
  await mkdir(dirName, { recursive: true })

  // generate every csv file for the report
  const csvFiles = [
    { name: 'dummy-report', func: generateDummyData }
  ]

  // compute the CSV data for each file, and write it to disk
  await Promise.all(csvFiles.map(csvFile => {
    return csvFile.func(periodId)
      .then(csvData => {
        console.dir(csvData)
        return writeFile(path.join(dirName, `${csvFile.name}.csv`), csvData)
      })
  }))
    .catch((err) => {
      rmdir(dirName, { recursive: true })
      throw err
    })

  // now we generate a zip file
  console.log(`wrote files to ${dirName}`)
}

async function getPriorReport (periodId) {
  const periodReportsDir = path.join(
    ARPA_REPORTS_DIR,
    periodId.toString()
  )

  const files = await readdir(periodReportsDir)
  const lastFile = files.sort()[files.length - 1]

  return {
    filename: lastFile,
    contents: 'abc'
  }
}

module.exports = {
  generateReport,
  getPriorReport
}
