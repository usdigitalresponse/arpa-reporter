/**
 * @module
 * Formatting helpers for spreadsheet output .
 */
const round = require('lodash/round')

function currency (value, optional = false) {
  if (optional && value == null) {
    return value
  }
  return round(value, 2).toString()
}

function zip (value, optional = false) {
  if (optional && value == null) {
    return value
  }
  return value.toString().padStart(5, '0')
}

function zip4 (value, optional = false) {
  if (optional && value == null) {
    return value
  }
  return value.toString().padStart(4, '0')
}

module.exports = {
  currency,
  zip,
  zip4
}
