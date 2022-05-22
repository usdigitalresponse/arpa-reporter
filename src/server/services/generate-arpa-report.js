const moment = require('moment')
const AdmZip = require('adm-zip')
const XLSX = require('xlsx')

const { applicationSettings } = require('../db/settings')
const { log } = require('../lib/log')
const { getTemplate } = require('./get-template')
const { recordsForReportingPeriod } = require('./records')

function isNotNull (value) {
  // `== null` matches null AND undefined
  return value != null
}

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

async function generateProject18 (records) {
  return records.map(record => {
    switch (record.type) {
      // TODO: Handle matching records
      default:
        return null
    }
  }).filter(isNotNull)
}

async function generateProject19 (records) {
  return records.map(record => {
    switch (record.type) {
      // TODO: Handle matching records
      default:
        return null
    }
  }).filter(isNotNull)
}

async function generateProject2128 (records) {
  return records.map(record => {
    switch (record.type) {
      // TODO: Handle matching records
      default:
        return null
    }
  }).filter(isNotNull)
}

async function generateProject214 (records) {
  return records.map(record => {
    switch (record.type) {
      // TODO: Handle matching records
      default:
        return null
    }
  }).filter(isNotNull)
}

async function generateProject236 (records) {
  return records.map(record => {
    switch (record.type) {
      // TODO: Handle matching records
      default:
        return null
    }
  }).filter(isNotNull)
}

async function generateProject31 (records) {
  return records.map(record => {
    switch (record.type) {
      // TODO: Handle matching records
      default:
        return null
    }
  }).filter(isNotNull)
}

async function generateProject32 (records) {
  return records.map(record => {
    switch (record.type) {
      // TODO: Handle matching records
      default:
        return null
    }
  }).filter(isNotNull)
}

async function generateProject4142 (records) {
  return records.map(record => {
    switch (record.type) {
      // TODO: Handle matching records
      default:
        return null
    }
  }).filter(isNotNull)
}

async function generateProject51518 (records) {
  return records.map(record => {
    switch (record.type) {
      // TODO: Handle matching records
      default:
        return null
    }
  }).filter(isNotNull)
}

async function generateProject519521 (records) {
  return records.map(record => {
    switch (record.type) {
      // TODO: Handle matching records
      default:
        return null
    }
  }).filter(isNotNull)
}

async function generateProjectBaseline (records) {
  return records.map(record => {
    log('record.type', record.type)
    switch (record.type) {
      case 'ec 1 - public health': {
        return [
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
        ]
      }
      default:
        return null
    }
  }).filter(isNotNull)
}

async function generateExpendituresGT50000 (records) {
  return records.map(record => {
    switch (record.type) {
      case 'expenditures > 50000': {
        return [
          null, // first col is blank
          record.content.Sub_Award_Lookup__c,
          record.content.Expenditure_Start__c,
          record.content.Expenditure_End__c,
          record.content.Expenditure_Amount__c
        ]
      }
      default:
        return null
    }
  }).filter(isNotNull)
}

async function generateExpendituresLT50000 (records) {
  return records.map(record => {
    switch (record.type) {
      // TODO: Handle matching records
      default:
        return null
    }
  }).filter(isNotNull)
}

async function generatePaymentsIndividualsLT50000 (records) {
  return records.map(record => {
    switch (record.type) {
      // TODO: Handle matching records
      default:
        return null
    }
  }).filter(isNotNull)
}

async function generateSubaward (records) {
  return records.map(record => {
    switch (record.type) {
      case 'awards > 50000': {
        return [
          null, // first col is blank
          record.content.Recipient_UEI__c,
          record.content.Recipient_EIN__c,
          record.content.Project_Identification_Number__c,
          record.content.Award_No__c,
          record.content.Award_Type__c,
          record.content.Award_Amount__c,
          record.content.Award_Date__c,
          record.content.Primary_Sector__c,
          record.content.If_Other__c,
          record.content.Period_of_Performance_Start__c,
          record.content.Period_of_Performance_End__c,
          record.content.Place_of_Performance_Address_1__c,
          record.content.Place_of_Performance_Address_2__c,
          record.content.Place_of_Performance_Address_3__c,
          record.content.Place_of_Performance_City__c,
          record.content.State_Abbreviated__c,
          record.content.Place_of_Performance_Zip__c,
          record.content.Place_of_Performance_Zip_4__c,
          record.content.Purpose_of_Funds__c,
          record.content.Description__c
        ]
      }
      default:
        return null
    }
  }).filter(isNotNull)
}

async function generateSubRecipient (records) {
  return records.map(record => {
    switch (record.type) {
      // TODO: Handle matching records
      default:
        return null
    }
  }).filter(isNotNull)
}

async function generateReport (periodId) {
  const records = await recordsForReportingPeriod(periodId)

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
    const csvData = await func(records)

    if (!Array.isArray(csvData)) {
      console.dir({ name, func })
      console.dir(csvData)
      throw new Error(`CSV Data from ${name} was not an array!`)
    }

    // ignore empty CSV files
    if (csvData.length === 0) {
      return
    }

    const template = await getTemplate(name)

    const sheet = XLSX.utils.aoa_to_sheet([...template, ...csvData])
    const csvString = XLSX.utils.sheet_to_csv(sheet, { forceQuotes: true })
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
