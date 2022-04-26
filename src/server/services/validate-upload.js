
const { documentsForUpload } = require('../db/documents')
const { setAgencyId } = require('../db/uploads')

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

function extractAgencyId (coverDocument) {
}

async function validateAgencyId ({ upload, documents }) {
  // grab agency id from the cover sheet
  const coverSheet = documents.find(doc => doc.type === 'cover')
  const agencyId = coverSheet[1][0]
  console.dir(coverSheet)

  // convenience: set agency id on the upload for easier filtering
  if (agencyId !== upload.agency_id) {
    setAgencyId(upload.id, agencyId)
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
  extractAgencyId,
  ValidationError
}
