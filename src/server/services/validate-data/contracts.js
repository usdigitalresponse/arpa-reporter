const {
  dateIsOnOrBefore,
  dropdownIncludes,
  isNotBlank,
  isPositiveNumber,
  isValidDate,
  isValidState,
  isValidSubrecipient,
  isValidZip,
  matchesFilePart
} = require("./validate");

// type pattern for this elements of the fields array is
// [
//   columnName: string,
//   validator: (val: any, content: obj?) => bool,
//   message: string?
// ]
const requiredFields = [
  ["contract number", isNotBlank],
  ["contract type", dropdownIncludes("contract type")],
  ["contract amount", isPositiveNumber],
  ["contract date", isValidDate],
  ["period of performance start date", isValidDate],
  ["period of performance end date", isValidDate],
  [
    "period of performance start date",
    dateIsOnOrBefore("period of performance end date"),
    "Performance end date can't be before the performance start date"
  ],
  [
    "contract date",
    dateIsOnOrBefore("period of performance start date"),
    "Contract date can't be after the performance start date"
  ],
  ["primary place of performance address line 1", isNotBlank],
  ["primary place of performance city name", isNotBlank],
  ["primary place of performance state code", isValidState],
  ["primary place of performance zip", isValidZip],
  ["primary place of performance country name", dropdownIncludes("country")],
  [
    "project id",
    matchesFilePart("projectId"),
    `The "project id" in the file name does not match the contract's "project id"`
  ],
  [
    "subrecipient id",
    isValidSubrecipient,
    'Each contract row must have a "subrecipient id" which is included in the "subrecipient" tab'
  ]
];

module.exports = requiredFields;
