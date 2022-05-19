const moment = require('moment')
const AdmZip = require('adm-zip')
const XLSX = require('xlsx')

const { applicationSettings } = require('../db/settings')
const { log } = require('../lib/log')
const { getTemplate } = require('./get-template')
const { recordsForReportingPeriod } = require('./records')

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
  return await getTemplate('Project Templates/project18_229233BulkUploads')
}

async function generateProject19 (periodId) {
  return await getTemplate('Project Templates/project19_234BulkUploads')
}

async function generateProject2128 (periodId) {
  return await getTemplate('Project Templates/project2128BulkUploads')
}

async function generateProject214 (periodId) {
  return await getTemplate('Project Templates/project214_224227BulkUploads')
}

async function generateProject236 (periodId) {
  return await getTemplate('Project Templates/project236BulkUploads')
}

async function generateProject31 (periodId) {
  return await getTemplate('Project Templates/project31BulkUpload')
}

async function generateProject32 (periodId) {
  return await getTemplate('Project Templates/project32BulkUpload')
}

async function generateProject4142 (periodId) {
  return await getTemplate('Project Templates/project4142BulkUpload')
}

async function generateProject51518 (periodId) {
  return await getTemplate('Project Templates/project51518BulkUpload')
}

async function generateProject519521 (periodId) {
  return await getTemplate('Project Templates/project519521BulkUpload')
}

async function generateProjectBaseline (periodId) {
  const template = await getTemplate('Project Templates/projectBaselineBulkUpload')
  const records = await recordsForReportingPeriod(periodId)
  const dataRows = []

  log(`generateProjectBaseline(${periodId})`)
  log('records.length', records.length)

  log('records', records)

  records.forEach(record => {
    log('record.type', record.type)
    switch (record.type) {
      case 'ec 1 - public health': {
        dataRows.push([
          null, // first col is blank
          '1-Public Health',
          record.subcategory,
          record.content.Name,
          record.content.Project_Identification_Number__c,
          record.content.Completion_Status__c,
          record.content.Adopted_Budget__c,
          record.content.Total_Obligations__c,
          record.content.Total_Expenditures__c,
          record.content.Current_Period_Obligations__c,
          record.content.Current_Period_Expenditures__c,
          record.content.Does_Project_Include_Capital_Expenditure__c,
          record.content.Total_Cost_Capital_Expenditure__c,
          record.content.Type_of_Capital_Expenditure__c,
          record.content.Type_of_Capital_Expenditure_Other__c,
          record.content.Capital_Expenditure_Justification__c,
          record.content.Project_Description__c,
          record.content.Program_Income_Earned__c,
          record.content.Program_Income_Expended__cs,
          record.content.Primary_Project_Demographics__c,
          record.content.Primary_Project_Demographics_Explanation__c,
          record.content.Secondary_Project_Demographics__c,
          record.content.Secondary_Proj_Demographics_Explanation__c,
          record.content.Tertiary_Project_Demographics__c,
          record.content.Tertiary_Proj_Demographics_Explanation__c,
          record.content.Structure_Objectives_of_Asst_Programs__c,
          record.content.Recipient_Approach_Description__c
        ])
      }
    }
  })

  return [
    ...template,
    ...dataRows
  ]
}

async function generateExpendituresGT50000 (periodId) {
  return await getTemplate('expendituresGT50000BulkUpload')
}

async function generateExpendituresLT50000 (periodId) {
  return await getTemplate('expendituresLT50000BulkUpload')
}

async function generatePaymentsIndividualsLT50000 (periodId) {
  return await getTemplate('paymentsIndividualsLT50000BulkUpload')
}

async function generateSubaward (periodId) {
  return await getTemplate('subawardBulkUpload')
}

async function generateSubRecipient (periodId) {
  return await getTemplate('subawardBulkUpload')
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
