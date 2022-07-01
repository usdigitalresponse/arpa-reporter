
const srcRules = require('../lib/templateRules.json')
const srcDropdowns = require('../lib/templateDropdowns.json')

function generateRules () {
  const rules = srcRules

  // subrecipient EIN is actually a length-10 string
  rules.subrecipient.EIN__c.dataType = 'String'
  rules.subrecipient.EIN__c.maxLength = 10

  rules.awards50k.Recipient_EIN__c.dataType = 'String'
  rules.awards50k.Recipient_EIN__c.maxLength = 10

  // subrecipient state dropdown should contain all states
  const states = srcDropdowns['State Code']
  rules.subrecipient.State_Abbreviated__c.listVals = states

  // awards50k state dropdown should contain all states
  rules.awards50k.State_Abbreviated__c.listVals = states

  // awards50k sector dropdowns come from dropdowns list
  const sectors = srcDropdowns['Sectors Designated as Essential Critical Infrastructure']
  rules.awards50k.Primary_Sector__c.listVals = sectors
  rules.ec4.Sectors_Critical_to_Health_Well_Being__c.listVals = sectors

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
