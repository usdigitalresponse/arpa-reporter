
const path = require('path')
const { mkdir, rmdir, writeFile, readdir, readFile } = require('fs/promises')
const moment = require('moment')
const zipper = require('zip-local')
const XLSX = require('xlsx')

const { applicationSettings } = require('../db/settings')
const { ARPA_REPORTS_DIR } = require('../environment')
const { getTemplate } = require('./get-template')

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

async function generateProject18 (periodId) {
  return getTemplate('Project Templates/project18_229233BulkUploads')
}

async function generateProject19 (periodId) {
  return getTemplate('Project Templates/project19_234BulkUploads')
}

async function generateProject2128 (periodId) {
  return getTemplate('Project Templates/project2128BulkUploads')
}

async function generateProject214 (periodId) {
  return getTemplate('Project Templates/project214_224227BulkUploads')
}

async function generateProject236 (periodId) {
  return getTemplate('Project Templates/project236BulkUploads')
}

async function generateProject31 (periodId) {
  return getTemplate('Project Templates/project31BulkUpload')
}

async function generateProject32 (periodId) {
  return getTemplate('Project Templates/project32BulkUpload')
}

async function generateProject4142 (periodId) {
  return getTemplate('Project Templates/project4142BulkUpload')
}

async function generateProject51518 (periodId) {
  return getTemplate('Project Templates/project51518BulkUpload')
}

async function generateProject519521 (periodId) {
  return getTemplate('Project Templates/project519521BulkUpload')
}

async function generateProjectBaseline (periodId) {
  return getTemplate('Project Templates/projectBaselineBulkUpload')
}

async function generateExpendituresGT50000 (periodId) {
  return getTemplate('expendituresGT50000BulkUpload')
}

async function generateExpendituresLT50000 (periodId) {
  return getTemplate('expendituresLT50000BulkUpload')
}

async function generatePaymentsIndividualsLT50000 (periodId) {
  return getTemplate('paymentsIndividualsLT50000BulkUpload')
}

async function generateSubaward (periodId) {
  return getTemplate('subawardBulkUpload')
}

async function generateSubRecipient (periodId) {
  return getTemplate('subawardBulkUpload')
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
    { name: 'project18_229233BulkUploads', func: generateProject18 },
    { name: 'project19_234BulkUploads', func: generateProject19 },
    { name: 'project2128BulkUploads', func: generateProject2128 },
    { name: 'project214_224227BulkUploads', func: generateProject214 },
    { name: 'project236BulkUploads', func: generateProject236 },
    { name: 'project31BulkUpload', func: generateProject31 },
    { name: 'project32BulkUpload', func: generateProject32 },
    { name: 'project4142BulkUpload', func: generateProject4142 },
    { name: 'project51518BulkUpload', func: generateProject51518 },
    { name: 'project519521BulkUpload', func: generateProject519521 },
    { name: 'projectBaselineBulkUpload', func: generateProjectBaseline },
    { name: 'expendituresGT50000BulkUpload', func: generateExpendituresGT50000 },
    { name: 'expendituresLT50000BulkUpload', func: generateExpendituresLT50000 },
    { name: 'paymentsIndividualsLT50000BulkUpload', func: generatePaymentsIndividualsLT50000 },
    { name: 'subawardBulkUpload', func: generateSubaward },
    { name: 'subRecipientBulkUpload', func: generateSubRecipient }
  ]

  // compute the CSV data for each file, and write it to disk
  await Promise.all(csvFiles.map(csvFile => {
    return csvFile.func(periodId)
      .then(csvData => {
        if (!Array.isArray(csvData)) {
          console.dir(csvFile)
          console.dir(csvData)
          throw new Error(`CSV Data from ${csvFile.name} was not an array!`)
        }

        const sheet = XLSX.utils.aoa_to_sheet(csvData)
        const csv = XLSX.utils.sheet_to_csv(sheet)
        return writeFile(path.join(dirName, `${csvFile.name}.csv`), csv)
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
