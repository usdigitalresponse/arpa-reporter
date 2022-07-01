
const moment = require('moment')

const { getReportingPeriod } = require('../db/reporting-periods')
const { setAgencyId, setEcCode, markValidated, markNotValidated } = require('../db/uploads')
const knex = require('../db/connection')
const { agencyByCode } = require('../db/agencies')
const { createRecipient, findRecipient, updateRecipient } = require('../db/arpa-subrecipients')

const { recordsForUpload } = require('./records')
const { getRules } = require('./validation-rules')
const { ecCodes } = require('../lib/arpa-ec-codes')

const ValidationError = require('../lib/validation-error')

async function validateAgencyId ({ upload, records, trns }) {
  // grab agency id from the cover sheet
  const coverSheet = records.find(doc => doc.type === 'cover').content
  const agencyCode = coverSheet['Agency Code']

  // must be set
  if (!agencyCode) {
    return new ValidationError('Agency code must be set', { tab: 'cover', row: 1, col: 'A' })
  }

  // must exist in the db
  const matchingAgency = (await agencyByCode(upload.tenant_id, agencyCode, trns))[0]
  if (!matchingAgency) {
    return new ValidationError(
      `Agency code ${agencyCode} does not match any known agency`,
      { tab: 'cover', row: 2, col: 'A' }
    )
  }

  // always set agency id if possible; we omit passing the transaction in this
  // case, so that the agency id gets set even if the upload fails to validate
  if (matchingAgency.id !== upload.agency_id) {
    await setAgencyId(upload.id, matchingAgency.id)
  }
}

async function validateEcCode ({ upload, records, trns }) {
  // grab ec code string from cover sheet
  const coverSheet = records.find(doc => doc.type === 'cover').content
  const codeString = coverSheet['Detailed Expenditure Category']

  if (!codeString) {
    return new ValidationError(
      'EC code must be set',
      { tab: 'cover', row: 2, col: 'D' }
    )
  }

  const codeParts = codeString.split('-')
  const code = codeParts[0]
  const desc = codeParts.slice(1, codeParts.length).join('-')

  if (ecCodes[code] !== desc) {
    return new ValidationError(
      `Record EC code ${code} (${desc}) does not match any known EC code`,
      { tab: 'cover', row: 2, col: 'D' }
    )
  }

  // always set EC code if possible; we omit passing the transaction in this
  // case, so that the code gets set even if the upload fails to validate
  if (code !== upload.ec_code) {
    await setEcCode(upload.id, code)
    upload.ec_code = code
  }
}

async function validateVersion ({ upload, records, rules }) {
  const logicSheet = records.find(record => record.type === 'logic').content
  const version = logicSheet.version

  const versionRule = rules.logic.version

  let error = null
  if (version < versionRule.version) {
    error = 'older'
  } else if (version > versionRule.version) {
    error = 'newer'
  }

  if (error) {
    return new ValidationError(
      `Upload template version (${version}) is ${error} than the latest input template (${versionRule.version})`,
      {
        tab: 'logic',
        row: 1,
        col: versionRule.columnName,
        severity: 'warn'
      }
    )
  }
}

async function validateReportingPeriod ({ upload, records, trns }) {
  const uploadPeriod = await getReportingPeriod(upload.tenant_id, upload.reporting_period_id, trns)
  const coverSheet = records.find(record => record.type === 'cover').content
  const errors = []

  const periodStart = moment(uploadPeriod.start_date)
  const sheetStart = moment(coverSheet['Reporting Period Start Date'])
  if (!periodStart.isSame(sheetStart)) {
    errors.push(new ValidationError(
      `Upload reporting period starts ${periodStart.format('L')} while record specifies ${sheetStart.format('L')}`,
      { tab: 'cover', row: 2, col: 'E' }
    ))
  }

  const periodEnd = moment(uploadPeriod.end_date)
  const sheetEnd = moment(coverSheet['Reporting Period End Date'])
  if (!periodEnd.isSame(sheetEnd)) {
    errors.push(new ValidationError(
      `Upload reporting period ends ${periodEnd.format('L')} while record specifies ${sheetEnd.format('L')}`,
      { tab: 'cover', row: 2, col: 'F' }
    ))
  }

  return errors
}

async function validateSubrecipientRecord ({ upload, record: recipient, typeRules: rules, recordErrors, trns }) {
  const errors = []

  // we should include at a primary identifier for all recipients
  if (!recipient.EIN__c && !recipient.Unique_Entity_Identifier__c) {
    errors.push(new ValidationError(
      'At least one of UEI or TIN/EIN must be set, but both are missing',
      { col: 'C, D', severity: 'err' }
    ))
  }

  // does the row already exist?
  let byUei = null
  if (recipient.Unique_Entity_Identifier__c) {
    byUei = await findRecipient(upload.tenant_id, recipient.Unique_Entity_Identifier__c, null, trns)
  }

  let byTin = null
  if (recipient.EIN__c) {
    byTin = await findRecipient(upload.tenant_id, null, recipient.EIN__c, trns)
  }

  // did we find two different subrecipients?
  if (byUei && byTin && byUei.id !== byTin.id) {
    errors.push(new ValidationError(
      'We already have a sub-recipient with given UEI, and a different one with given TIN/EIN',
      { col: 'C, D', severity: 'warn' }
    ))
  }

  const existing = byUei || byTin

  // if the current upload owns the recipient, we can actually update it
  let isOwnedByThisUpload = true
  if (
    !existing ||
    existing.upload_id !== upload.id ||
    existing.updated_at
  ) isOwnedByThisUpload = false

  // the record has already been validated before this method was invoked. how
  // did the validation go?
  const isRecordValid = recordErrors.length === 0

  // validate that existing record and given recipient match
  //
  // TODO: what if the same upload specifies the same recipient multiple times,
  // but different?
  if (existing) {
    // if we own it, we can just update it
    if (isOwnedByThisUpload) {
      if (isRecordValid) {
        await updateRecipient(existing.id, { record: recipient }, trns)
      }

    // otherwise, generate warnings about diffs
    } else {
      const recipientId = existing.uei || existing.tin
      const record = JSON.parse(existing.record)

      // make sure that each key in the record matches the recipient
      for (const [key, rule] of Object.entries(rules)) {
        if ((record[key] || recipient[key]) && record[key] !== recipient[key]) {
          errors.push(new ValidationError(
            `Subrecipient ${recipientId} exists with '${rule.humanColName}' as '${record[key]}', \
            but upload specifies '${recipient[key]}'`,
            { col: rule.columnName, severity: 'warn' }
          ))
        }
      }
    }

  // if it's new, and it's passed validation, then insert it
  } else {
    if (isRecordValid) {
      const dbRow = {
        uei: recipient.Unique_Entity_Identifier__c,
        tin: recipient.EIN__c,
        record: recipient,
        upload_id: upload.id,
        tenant_id: upload.tenant_id
      }
      await createRecipient(dbRow, trns)
    }
  }

  return errors
}

async function validateRecord ({ upload, record, typeRules: rules, trns }) {
  // start by trimming any whitespace
  for (const key of Object.keys(rules)) {
    if (record[key] && (typeof record[key]) === 'string') {
      record[key] = record[key].trim()
    }
  }

  // placeholder for rule errors we're going to find
  const errors = []

  // check all the rules
  for (const [key, rule] of Object.entries(rules)) {
    // if the rule only applies on different EC codes, skip it
    if (rule.ecCodes && (!upload.ec_code || rule.ecCodes.indexOf(upload.ec_code) < 0)) {
      continue
    }

    // if there's something in the field, make sure it meets requirements
    if (record[key]) {
      // make sure pick value is one of pick list values
      if (rule.listVals.length > 0) {
        // for pick lists, the value must be one of possible values
        if (rule.dataType === 'Pick List' && rule.listVals.indexOf(record[key]) < 0) {
          errors.push(new ValidationError(
            `Value for ${key} must be one of ${rule.listVals.length} options in the input template`,
            { col: rule.columnName, severity: 'err' }
          ))
        }

        // for multi select, all the values must be in the list of possible values
        if (rule.dataType === 'Multi-Select') {
          const entries = record[key].split(';').map(val => val.trim())
          for (const entry of entries) {
            if (rule.listVals.indexOf(entry) < 0) {
              errors.push(new ValidationError(
                `Entry '${entry}' of ${key} is not one of ${rule.listVals.length} valid options`,
                { col: rule.columnName, severity: 'err' }
              ))
            }
          }
        }
      }

      // make sure max length is not too long
      if (rule.maxLength && String(record[key]).length > rule.maxLength) {
        errors.push(new ValidationError(
          `Value for ${key} cannot be longer than ${rule.maxLength} (currently, ${String(record[key]).length})`,
          { col: rule.columnName, severity: 'err' }
        ))
      }

    // if the field is unset, is that okay?
    } else {
      // make sure required keys are present
      if (rule.required === true) {
        errors.push(new ValidationError(
          `Value is required for ${key}`,
          { col: rule.columnName, severity: 'err' }
        ))
      }
    }
  }

  // return all the found errors
  return errors
}

async function validateRules ({ upload, records, rules, trns }) {
  const errors = []

  // go through every rule type we have
  for (const [type, typeRules] of Object.entries(rules)) {
    // find records of the given rule type
    const tRecords = records.filter(rec => rec.type === type).map(r => r.content)

    // for each of those records, generate a list of rule violations
    for (const [recordIdx, record] of tRecords.entries()) {
      let recordErrors
      try {
        recordErrors = await validateRecord({ upload, record, typeRules, trns })
      } catch (e) {
        recordErrors = [(
          new ValidationError(`unexpected error validating record: ${e.message}`)
        )]
      }

      // special sub-recipient validation
      try {
        if (type === 'subrecipient') {
          recordErrors = [
            ...recordErrors,
            ...(await validateSubrecipientRecord({ upload, record, typeRules, recordErrors, trns }))
          ]
        }
      } catch (e) {
        recordErrors = [
          ...recordErrors,
          new ValidationError(`unexpectedError validating subrecipient: ${e.message}`)
        ]
      }

      // each rule violation gets assigned a row in a sheet; they already set their column
      recordErrors.forEach(error => {
        error.tab = type
        error.row = 13 + recordIdx // TODO: how do we know the data starts at row 13?

        // save each rule violation in the overall list
        errors.push(error)
      })
    }
  }

  return errors
}

async function validateUpload (upload, user, trns = null) {
  // holder for our validation errors
  const errors = []

  // holder for post-validation functions

  // grab the records
  const records = await recordsForUpload(upload)

  // grab the rules
  const rules = await getRules()

  // list of all of our validations
  const validations = [
    validateVersion,
    validateAgencyId,
    validateEcCode,
    validateReportingPeriod,
    validateRules
  ]

  // we should do this in a transaction, unless someone is doing it for us
  const ourTransaction = !trns
  if (ourTransaction) trns = await knex.transaction()

  // run validations, one by one
  for (const validation of validations) {
    try {
      errors.push(await validation({ upload, records, rules, trns }))
    } catch (e) {
      errors.push(new ValidationError(`validation ${validation.name} failed: ${e}`))
    }
  }

  // flat list without any nulls, including errors and warnings
  const flatErrors = errors.flat().filter(x => x)

  // fatal errors determine if the upload fails validation
  const fatal = flatErrors.filter(x => x.severity === 'err')

  // if we successfully validated for the first time, let's mark it!
  if (fatal.length === 0 && !upload.validated_at) {
    await markValidated(upload.id, user.id, trns)
    if (ourTransaction) trns.commit()

  // if it was valid before but is no longer valid, clear it
  } else if (fatal.length > 0 && upload.validated_at) {
    if (ourTransaction) {
      trns.rollback()
      await markNotValidated(upload.id)
    } else {
      await markNotValidated(upload.id, trns)
    }
  }

  return flatErrors
}

module.exports = {
  validateUpload,
  ValidationError
}
