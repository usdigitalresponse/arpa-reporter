const { matchesFilePart } = require('./validate')
const { validateSingleRecord } = require('./validate')

const requiredFields = [
  [
    'agency code',
    matchesFilePart('agencyCode'),
    'The agency code "{}" in the file name does not match the cover\'s agency code'
  ]
]

module.exports = validateSingleRecord(
  'cover',
  requiredFields,
  'cover requires a row with "agency code"'
)
