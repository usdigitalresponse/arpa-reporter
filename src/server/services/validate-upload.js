
const moment = require('moment')

const { get: getReportingPeriod } = require('../db/reporting-periods')
const { recordsForUpload } = require('./records')
const { setAgencyId, setEcCode, markValidated, markNotValidated } = require('../db/uploads')
const { agencyByCode } = require('../db/agencies')
const { ecCodes } = require('../lib/arpa-ec-codes')

const ValidationError = require('../lib/validation-error')

async function validateAgencyId ({ upload, records, trns }) {
  // grab agency id from the cover sheet
  const coverSheet = records.find(doc => doc.type === 'cover').content
  const agencyCode = coverSheet['Agency Code']

  // must be set
  if (!agencyCode) {
    return new ValidationError('Agency code must be set', { tab: 'cover', row: 1, col: 0 })
  }

  // must exist in the db
  const matchingAgency = (await agencyByCode(upload.tenant_id, agencyCode, trns))[0]
  if (!matchingAgency) {
    return new ValidationError(
      `Agency code ${agencyCode} does not match any known agency`,
      { tab: 'cover', row: 2, col: 1 }
    )
  }

  // set agency id on the upload, for disambiguation
  if (matchingAgency.id !== upload.agency_id) {
    await setAgencyId(upload.id, matchingAgency.id, trns)
  }
}

async function validateEcCode ({ upload, records, trns }) {
  // grab ec code string from cover sheet
  const coverSheet = records.find(doc => doc.type === 'cover').content
  const codeString = coverSheet['Detailed Expenditure Category']

  const codeParts = codeString.split('-')
  const code = codeParts[0]
  const desc = codeParts.slice(1, codeParts.length).join('-')

  if (ecCodes[code] !== desc) {
    return new ValidationError(
      `Record EC code ${code} (${desc}) does not match any known EC code`,
      { tab: 'cover', row: 2, col: 4 }
    )
  }

  // set EC code on the upload, for disambiguation
  if (code !== upload.ec_code) {
    await setEcCode(upload.id, code, trns)
  }
}

async function validateReportingPeriod ({ upload, records, trns }) {
  const uploadPeriod = await getReportingPeriod(upload.reporting_period_id, trns)
  const coverSheet = records.find(record => record.type === 'cover').content
  const errors = []

  const periodStart = moment(uploadPeriod.start_date)
  const sheetStart = moment(coverSheet['Reporting Period Start Date'])
  if (!periodStart.isSame(sheetStart)) {
    errors.push(new ValidationError(
      `Upload reporting period starts ${periodStart.format('L')} while record specifies ${sheetStart.format('L')}`,
      { tab: 'cover', row: 2, col: 5 }
    ))
  }

  const periodEnd = moment(uploadPeriod.end_date)
  const sheetEnd = moment(coverSheet['Reporting Period End Date'])
  if (!periodEnd.isSame(sheetEnd)) {
    errors.push(new ValidationError(
      `Upload reporting period ends ${periodEnd.format('L')} while record specifies ${sheetEnd.format('L')}`,
      { tab: 'cover', row: 2, col: 6 }
    ))
  }

  return errors
}

function validateSubrecipients ({ upload, records }) {

}

// TODO(mbroussard): is it a bug that user is not always passed in?
async function validateUpload (upload, user, trns) {
  // holder for our validation errors
  const errors = []

  // holder for post-validation functions

  // grab the records
  const records = await recordsForUpload(upload)

  // list of all of our validations
  const validations = [
    validateAgencyId,
    validateEcCode,
    validateReportingPeriod,
    validateSubrecipients
  ]

  // run validations, one by one
  for (const validation of validations) {
    try {
      errors.push(await validation({ records, upload, trns }))
    } catch (e) {
      errors.push(new ValidationError(`validation ${validation.name} failed: ${e}`))
    }
  }

  // if we successfully validated for the first time, let's mark it!
  const flatErrors = errors.flat().filter(x => x)
  if (flatErrors.length === 0 && !upload.validated_at) {
    markValidated(upload.id, user.id, trns)

  // if it was valid before but is no longer valid, clear it
  } else if (flatErrors.length > 1 && upload.validated_at) {
    markNotValidated(upload.id, trns)
  }

  return flatErrors
}

module.exports = {
  validateUpload,
  ValidationError
}
