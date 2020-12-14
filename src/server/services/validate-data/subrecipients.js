const {
  dropdownIncludes,
  hasSubrecipientKey,
  isNotBlank,
  isValidState,
  isValidZip,
  validateDocuments,
  whenBlank,
  whenUS
} = require("./validate");

const requiredFields = [
  [
    "",
    hasSubrecipientKey,
    `Each subrecipient must have either an "identification number" or a "duns number"`
  ],
  ["legal name", isNotBlank, "Legal name must not be blank"],
  [
    "organization type",
    dropdownIncludes("organization type"),
    'Organization type "{}" is not valid'
  ],

  [
    "address line 1",
    whenBlank("duns number", isNotBlank),
    "Address line 1 must not be blank when DUNS number is not provided"
  ],
  [
    "city name",
    whenBlank("duns number", isNotBlank),
    "City name must not be blank when DUNS number is not provided"
  ],
  [
    "state code",
    whenBlank("duns number", whenUS("country name", isValidState)),
    "State code must be a valid state code when DUNS number is not provided"
  ],
  [
    "zip",
    whenBlank("duns number", whenUS("country name", isValidZip)),
    "Zip must be a valid zip when DUNS number is not provided"
  ],
  [
    "country name",
    whenBlank("duns number", dropdownIncludes("country")),
    "Country name must be a valid country name when DUNS number is not provided"
  ]
];

module.exports = validateDocuments("subrecipient", requiredFields);
