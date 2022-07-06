/**
 * @module
 * Formatting helpers for spreadsheet output .
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
  boolean,
  currency,
  ec,
  zip,
  zip4
}
