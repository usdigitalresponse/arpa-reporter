
const path = require('path')
const { mkdir, rmdir, writeFile, readdir, readFile } = require('fs/promises')
const moment = require('moment')
const { stringify } = require('csv-stringify')
const zipper = require('zip-local')

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
        const contents = stringify(csvData)
        return writeFile(path.join(dirName, `${csvFile.name}.csv`), contents)
      })
  }))
    .catch((err) => {
      rmdir(dirName, { recursive: true })
      throw err
    })

  // now we generate a zip file
  const zipfileName = dirName + '.zip'
  const zipfile = zipper.sync.zip(dirName)
  zipfile.compress().save(zipfileName)

  // return the correct format
  return {
    filename: path.basename(zipfileName),
    content: (await readFile(zipfileName))
  }
}

async function getPriorReport (periodId) {
  const periodReportsDir = path.join(
    ARPA_REPORTS_DIR,
    periodId.toString()
  )

  const files = await readdir(periodReportsDir)
  const lastFileName = path.join(
    periodReportsDir,
    files.sort()[files.length - 1]
  )

  return {
    filename: path.basename(lastFileName),
    contents: (await readFile(lastFileName))
  }
}

module.exports = {
  generateReport,
  getPriorReport
}
