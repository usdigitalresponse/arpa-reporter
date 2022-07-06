/**
 * @module
 *
 * Formatting helpers for spreadsheet output.  Note that these helpers are
 * designed to NOT apply any validation of their own.  Output generation should
 * reliably succeed if uploads have all passed validation.
 */
const round = require('lodash/round')

const EXPENDITURE_CATEGORIES = {
  ec1: '1-Public Health',
  ec2: '2-Negative Economic Impacts',
  ec3: '3-Public Health-Negative Economic Impact: Public Sector Capacity',
  ec4: '4-Premium Pay',
  ec5: '5-Infrastructure',
  ec7: '7-Administrative and Other'
}

/**
 * Normalize casing of single word values.
 * This is especially useful for "Yes"/"No" responses.
 *
 * @param {string} value
 * @returns {string}
 */
function capitalizeFirstLetter (value) {
  if (value == null) return value
  return `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}`
}

function currency (value) {
  if (value == null) return value
  return round(value, 2).toString()
}

function ec (value) {
  return EXPENDITURE_CATEGORIES[value]
}

function zip (value) {
  if (value == null) return value
  return value.toString().padStart(5, '0')
}

function zip4 (value) {
  if (value == null) return value
  return value.toString().padStart(4, '0')
}

module.exports = {
  capitalizeFirstLetter,
  currency,
  ec,
  zip,
  zip4
}
