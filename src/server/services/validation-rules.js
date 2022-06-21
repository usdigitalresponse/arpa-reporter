
const srcRules = require('../lib/templateRules.json')
const srcDropdowns = require('../lib/templateDropdowns.json')

function generateRules () {
  const rules = JSON.parse(JSON.stringify(srcRules))

  // subrecipient state dropdown should contain all states
  const states = srcDropdowns['State Code']
  rules.subrecipient.State_Abbreviated__c.listVals = states

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
