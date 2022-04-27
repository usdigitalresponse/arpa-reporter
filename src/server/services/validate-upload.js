
const moment = require('moment')

const { get: getReportingPeriod } = require('../db/reporting-periods')
const { documentsForUpload } = require('../db/documents')
const { setAgencyId, markValidated, markNotValidated } = require('../db/uploads')
const { agencyByCode } = require('../db/agencies')

class ValidationError extends Error {
  constructor (message, { severity = 1, tab = null, row = null, col = null } = {}) {
    super(message)
    this.severity = severity
    this.tab = tab
    this.row = row
    this.col = col
  }

  toObject () {
    return {
      message: this.message,
      severity: this.severity,
      tab: this.tab,
      row: this.row,
      col: this.col
    }
  }
}

async function validateAgencyId ({ upload, documents }) {
  // grab agency id from the cover sheet
  const coverSheet = documents.find(doc => doc.type === 'cover').content
  const agencyCode = coverSheet[1][0]

  // must be set
  if (!agencyCode) {
    return new ValidationError('Agency code must be set', { tab: 'cover', row: 1, col: 0 })
  }

  // must exist in the db
  const matchingAgency = (await agencyByCode(agencyCode))[0]
  if (!matchingAgency) {
    return new ValidationError(
      `Agency code ${agencyCode} does not match any known agency`,
      { tab: 'cover', row: 2, col: 1 }
    )
  }

  // convenience: set agency id on the upload for easier filtering
  if (matchingAgency.id !== upload.agency_id) {
    await setAgencyId(upload.id, matchingAgency.id)
  }
}

// we subtract -2 because of a bug in lotus 1-2-3. fml.
// https://www.kirix.com/stratablog/excel-date-conversion-days-from-1900.html
function msDateToMoment (msDate) {
  return moment('1900-01-01').add(Number(msDate) - 2, 'days')
}

async function validateReportingPeriod ({ upload, documents }) {
  const uploadPeriod = await getReportingPeriod(upload.reporting_period_id)

  const coverSheet = documents.find(doc => doc.type === 'cover').content
  console.dir(coverSheet[1])

  const errors = []

  const periodStart = moment(uploadPeriod.start_date)
  const sheetStart = msDateToMoment(coverSheet[1][4])
  if (!periodStart.isSame(sheetStart)) {
    errors.push(new ValidationError(
      `Upload reporting period starts ${periodStart.format('L')} while document specifies ${sheetStart.format('L')}`,
      { tab: 'cover', row: 2, col: 5 }
    ))
  }

  const periodEnd = moment(uploadPeriod.end_date)
  const sheetEnd = msDateToMoment(coverSheet[1][5])
  if (!periodEnd.isSame(sheetEnd)) {
    errors.push(new ValidationError(
      `Upload reporting period ends ${periodEnd.format('L')} while document specifies ${sheetEnd.format('L')}`,
      { tab: 'cover', row: 2, col: 6 }
    ))
  }

  return errors
}

function validateSubrecipients ({ upload, documents }) {

}

async function validateUpload (upload, user) {
  // holder for our validation errors
  const errors = []

  // grab the documents
  const documents = await documentsForUpload(upload.id)

  // run validations, one by one
  const validations = [
    validateAgencyId,
    validateReportingPeriod,
    validateSubrecipients
  ]

  for (const validation of validations) {
    try {
      errors.push(await validation({ documents, upload }))
    } catch (e) {
      errors.push(new ValidationError(`validation ${validation.name} failed: ${e}`))
    }
  }

  // if we successfully validated for the first time, let's mark it!
  const flatErrors = errors.flat().filter(x => x)
  if (flatErrors.length === 0 && !upload.validated_at) {
    markValidated(upload.id, user.id)

  // if it was valid before but is no longer valid, clear it
  } else if (flatErrors.length > 1 && upload.validated_at) {
    markNotValidated(upload.id)
  }

  return flatErrors
}

module.exports = {
  validateUpload,
  ValidationError
}
