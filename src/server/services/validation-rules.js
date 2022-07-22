
const srcRules = require('../lib/templateRules.json')

const recordValueFormatters = {
  makeString: (val) => String(val),
  trimWhitespace: (val) => val.trim(),
  removeCommas: (val) => val.replace(/,/g, ''),
  removeSepDashes: (val) => val.replace(/^-/, '').replace(/;\s*-/g, ';'),
  toLowerCase: (val) => val.toLowerCase(),
  childCareSpacing: (val) => (val === 'family or childcare' ? 'family or child care' : val)
}

function generateRules () {
  const rules = srcRules

  // subrecipient EIN is actually a length-10 string
  rules.subrecipient.EIN__c.dataType = 'String'
  rules.subrecipient.EIN__c.maxLength = 10

  rules.awards50k.Recipient_EIN__c.dataType = 'String'
  rules.awards50k.Recipient_EIN__c.maxLength = 10

  // value formatters modify the value in the record before it's validated
  // we check any rule against the formatted value
  // for any values we format, we should format them the same way when we export
  for (const ruleType of Object.keys(rules)) {
    for (const rule of Object.values(rules[ruleType])) {
      rule.valueFormatters = []

      if (rule.dataType === 'String') {
        rule.valueFormatters.push(recordValueFormatters.makeString)
        rule.valueFormatters.push(recordValueFormatters.trimWhitespace)
      }

      if (rule.dataType === 'Multi-Select') {
        rule.valueFormatters.push(recordValueFormatters.removeCommas)
        rule.valueFormatters.push(recordValueFormatters.removeSepDashes)
      }

      if (rule.listVals.length > 0) {
        rule.valueFormatters.push(recordValueFormatters.toLowerCase)
      }

      if (rule.listVals.includes('Family or child care')) {
        rule.valueFormatters.push(recordValueFormatters.childCareSpacing)
      }
    }
  }

  return rules
}

let generatedRules

function getRules () {
  if (!generatedRules) generatedRules = generateRules()

  return generatedRules
}

module.exports = {
  getRules
}
