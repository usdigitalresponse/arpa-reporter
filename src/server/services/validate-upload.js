
const { documentsForUpload } = require('../db/documents')
const { setAgencyId } = require('../db/uploads')
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
  const matchingAgencies = await agencyByCode(agencyCode)
  if (matchingAgencies.length < 1) {
    return new ValidationError(
      `Agency code ${agencyCode} does not match any known agency`,
      { tab: 'cover', row: 1, col: 0 }
    )
  }

  // convenience: set agency id on the upload for easier filtering
  if (agencyCode !== upload.agency_id) {
    setAgencyId(upload.id, agencyCode)
  }
}

function validateReportingPeriod ({ upload, documents }) {
  return null
}

async function validateUpload (upload) {
  // holder for our validation errors
  const errors = []

  // grab the documents
  const documents = await documentsForUpload(upload.id)

  // run validations, one by one
  const validations = [
    validateAgencyId,
    validateReportingPeriod
  ]

  for (const validation of validations) {
    try {
      errors.push(await validation({ documents, upload }))
    } catch (e) {
      errors.push(new ValidationError(`validation ${validation.name} failed: ${e}`))
    }
  }

  return errors.flat().filter(x => x)
}

module.exports = {
  validateUpload,
  ValidationError
}
