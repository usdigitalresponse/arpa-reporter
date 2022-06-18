const moment = require('moment')
const XLSX = require('xlsx')

const { get, getAll } = require('../db/reporting-periods')
const { getCurrentReportingPeriodID } = require('../db/settings')
const { recordsForReportingPeriod } = require('../services/records')
const { log } = require('../lib/log')
const { usedForTreasuryExport } = require('../db/uploads')

const COLUMN = {
  EC_BUDGET: 'Adopted Budget (EC tabs)',
  EC_TCO: 'Total Cumulative Obligations (EC tabs)',
  EC_TCE: 'Total Cumulative Expenditures (EC tabs)',
  EC_CPO: 'Current Period Obligations (EC tabs)',
  EC_CPE: 'Current Period Expenditures (EC tabs)',
  E50K_OBLIGATION: 'Subaward Obligations (Subaward >50k)',
  E50K_TEA: 'Total Expenditure Amount (Expenditures >50k)',
  E_CPO: 'Current Period Obligations (Aggregate Awards <50k)',
  E_CPE: 'Current Period Expenditures (Aggregate Awards <50k)'
}

async function generate () {
  const periodId = await getCurrentReportingPeriodID()
  log(`generate(${periodId})`)

  // generate sheets
  const obligations = await createObligationSheet(periodId)

  // compose workbook
  const sheet = XLSX.utils.json_to_sheet(obligations, { dateNF: 'MM/DD/YYYY' })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Obligations & Expenditures')

  return {
    filename: `audit report ${moment().format('yy-MM-DD')}.xlsx`,
    outputWorkBook: XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
  }
}

async function createObligationSheet (periodId) {
  // select active reporting periods and sort by date
  const currentReportingPeriod = await get(periodId)
  const allReportingPeriods = await getAll()
  const reportingPeriods = allReportingPeriods.filter(
    period =>
      new Date(period.end_date) <= new Date(currentReportingPeriod.end_date)
  )
  reportingPeriods.sort((a, b) => new Date(a.end_date) - new Date(b.end_date))

  // collect aggregate obligations and expenditures by upload
  const rows = await Promise.all(
    reportingPeriods.map(async period => {
      const uploads = await usedForTreasuryExport(period.id)
      const records = await recordsForReportingPeriod(period.id)

      return await Promise.all(uploads.map(async upload => {
        const emptyRow = {
          'Reporting Period': period.name,
          'Period End Date': new Date(period.end_date),
          'Upload': upload.filename,
          [COLUMN.EC_BUDGET]: 0,
          [COLUMN.EC_TCO]: 0,
          [COLUMN.EC_TCE]: 0,
          [COLUMN.EC_CPO]: 0,
          [COLUMN.EC_CPE]: 0,
          [COLUMN.E50K_OBLIGATION]: 0,
          [COLUMN.E50K_TEA]: 0,
          [COLUMN.E_CPO]: 0,
          [COLUMN.E_CPE]: 0
        }

        const row = records
          .filter(record => record.upload.id === upload.id)
          .reduce((row, record) => {
            switch (record.type) {
              case 'ec1':
              case 'ec2':
              case 'ec3':
              case 'ec4':
              case 'ec5':
              case 'ec7':
                return {
                  ...row,
                  [COLUMN.EC_BUDGET]:
                    row[COLUMN.EC_BUDGET] + record.content.Adopted_Budget__c,
                  [COLUMN.EC_TCO]:
                    row[COLUMN.EC_TCO] + record.content.Total_Obligations__c,
                  [COLUMN.EC_TCE]:
                    row[COLUMN.EC_TCE] + record.content.Total_Expenditures__c,
                  [COLUMN.EC_CPO]:
                    row[COLUMN.EC_CPO] +
                    record.content.Current_Period_Obligations__c,
                  [COLUMN.EC_CPE]:
                    row[COLUMN.EC_CPE] +
                    record.content.Current_Period_Expenditures__c
                }
              case 'awards50k':
                return {
                  ...row,
                  [COLUMN.E50K_OBLIGATION]:
                    row[COLUMN.E50K_OBLIGATION] + record.content.Award_Amount__c
                }
              case 'expenditures50k':
                return {
                  ...row,
                  [COLUMN.E50K_TEA]:
                    row[COLUMN.E50K_TEA] + record.content.Expenditure_Amount__c
                }
              case 'awards':
                return {
                  ...row,
                  [COLUMN.E_CPO]:
                    row[COLUMN.E_CPO] +
                    record.content.Quarterly_Obligation_Amt_Aggregates__c,
                  [COLUMN.E_CPE]:
                    row[COLUMN.E_CPE] +
                    record.content.Quarterly_Expenditure_Amt_Aggregates__c
                }
              default:
                return row
            }
          }, emptyRow)

        return row
      }))
    })
  )

  return rows.flat()
}

module.exports = {
  generate
}
