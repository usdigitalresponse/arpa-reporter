
const moment = require('moment')

const { get: getReportingPeriod } = require('../db/reporting-periods')
const { setAgencyId, setEcCode, markValidated, markNotValidated } = require('../db/uploads')
const { agencyByCode } = require('../db/agencies')
const { createRecipient, findRecipient, updateRecipient } = require('../db/arpa-recipients')

const { recordsForUpload } = require('./records')
const { rulesForUpload } = require('./validation-rules')
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
  const matchingAgency = (await agencyByCode(agencyCode, trns))[0]
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

async function validateRecipientRecord ({ upload, recipient, rules, trns }) {
  const errors = []

  // does the row already exist?
  let existing = null
  if (recipient.EIN__c || recipient.Unique_Entity_Identifier__c) {
    existing = await findRecipient(recipient.Unique_Entity_Identifier__c, recipient.EIN__c, trns)
  } else {
    errors.push(new ValidationError(
      'At least one of UEI or TIN must be set, but both are missing',
      { col: 'C, D' }
    ))
  }

  // validate that existing record and given recipient match
  //
  // TODO: what if the same upload specifies the same recipient multiple times,
  // but different?
  //
  if (existing && existing.upload_id !== upload.id) {
    const recipientId = existing.uei || existing.tin
    const record = JSON.parse(existing.record)

    // make sure that each key in the record matches the recipient
    //
    // TODO : what if the recipient has keys not found in the record?
    //
    for (const ek of Object.keys(record)) {
      if (record[ek] !== recipient[ek]) {
        errors.push(new ValidationError(
          `Recipient ${recipientId} exists with '${ek}' as '${record[ek]}', \
          but upload specifies '${recipient[ek]}'`,
          { col: rules[ek]?.columnName }
        ))
      }
    }

  // validate that the record is valid before inserting
  } else {
    // check all the rules
    for (const [key, rule] of Object.entries(rules)) {
      if (rule.required) {
        if (!recipient[key]) {
          errors.push(new ValidationError(
            `Value is required for ${key}`,
            { col: rule.columnName }
          ))
        }
      }
    }

    // if it's valid, we can insert it into the db
    if (errors.length === 0) {
      const dbRow = {
        uei: recipient.Unique_Entity_Identifier__c,
        tin: recipient.EIN__c,
        record: recipient,
        upload_id: upload.id
      }

      if (existing?.upload_id === upload.id) {
        await updateRecipient(dbRow, trns)
      } else {
        await createRecipient(dbRow, trns)
      }
    }
  }

  return errors
}

async function validateRecipients ({ upload, records, rules, trns }) {
  const errors = []

  // validate each, and save the errors
  const recipients = records.filter(rec => rec.type === 'subrecipient').map(r => r.content)

  for (const [rowIdx, recipient] of recipients.entries()) {
    try {
      for (const error of await validateRecipientRecord({
        upload, recipient, rules: rules.subrecipient, trns
      })) {
        error.tab = 'subrecipient'
        error.row = 13 + rowIdx // TODO: how do we know the data starts at row 13?
        errors.push(error)
      }
    } catch (e) {
      errors.push(new ValidationError(
        `unexpected error validating recipient: ${e}`,
        { tab: 'subrecipient', row: 13 + rowIdx }
      ))
    }
  }

  return errors
}

async function validateUpload (upload, user, trns) {
  // holder for our validation errors
  const errors = []

  // holder for post-validation functions

  // grab the records
  const records = await recordsForUpload(upload)

  // grab the rules
  const rules = await rulesForUpload(upload)

  // list of all of our validations
  const validations = [
    validateAgencyId,
    validateEcCode,
    validateReportingPeriod,
    validateRecipients
  ]

  // run validations, one by one
  for (const validation of validations) {
    try {
      errors.push(await validation({ upload, records, rules, trns }))
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
