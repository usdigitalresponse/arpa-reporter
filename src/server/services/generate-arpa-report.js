const moment = require('moment')
const AdmZip = require('adm-zip')
const XLSX = require('xlsx')

const { applicationSettings } = require('../db/settings')
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
  // generate every csv file for the report
  const csvObjects = [
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
    {
      name: 'expendituresGT50000BulkUpload',
      func: generateExpendituresGT50000
    },
    {
      name: 'expendituresLT50000BulkUpload',
      func: generateExpendituresLT50000
    },
    {
      name: 'paymentsIndividualsLT50000BulkUpload',
      func: generatePaymentsIndividualsLT50000
    },
    { name: 'subawardBulkUpload', func: generateSubaward },
    { name: 'subRecipientBulkUpload', func: generateSubRecipient }
  ]

  const zip = new AdmZip()

  // compute the CSV data for each file, and write it into the zip container
  const csvPromises = csvObjects.map(async ({ name, func }) => {
    const csvData = await func(periodId)

    if (!Array.isArray(csvData)) {
      console.dir({ name, func })
      console.dir(csvData)
      throw new Error(`CSV Data from ${name} was not an array!`)
    }

    const sheet = XLSX.utils.aoa_to_sheet(csvData)
    const csvString = XLSX.utils.sheet_to_csv(sheet)
    const buffer = Buffer.from('\ufeff' + csvString, 'utf8')
    zip.addFile(name + '.csv', buffer)
  })

  const reportNamePromise = generateReportName(periodId)

  const [reportName] = await Promise.all([
    reportNamePromise,
    ...csvPromises
  ])

  // return the correct format
  return {
    filename: reportName + '.zip',
    content: zip.toBuffer()
  }
}

module.exports = {
  generateReport
}
