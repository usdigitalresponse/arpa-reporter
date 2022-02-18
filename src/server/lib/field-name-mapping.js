
/*  sheetNameMap keys are the sheet names in the Treasury Output Spreadsheet,
  values are the sheet names in the Agency Input Spreadsheet, forced
  to lower case by getTemplateSheets().
  The values go in the 'type' field in the 'documents' table of the database,
  which are used to group the records into output sheets
  */
// prettier-ignore
const sheetNameMap = {
  'Cover Page': 'cover',
  Projects: 'projects',
  'Sub Recipient': 'subrecipient',
  Contracts: 'contracts',
  Grants: 'grants',
  Loans: 'loans',
  Transfers: 'transfers',
  Direct: 'direct',
  'Aggregate Awards < 50000': 'aggregate awards < 50000',
  'Aggregate Payments Individual': 'aggregate payments individual'
}

/*  sheetNameAliases are needed by the test fixtures, which have old versions of
  the sheet names.
  Keys are the sheet names in the input spreadsheets, values are what
  they are called in the document records of the database.
  */
// prettier-ignore
const sheetNameAliases = {
  subrecipients: 'subrecipient'
}

/* columnNameMap keys are column names in the Treasury Output Workbook,
  values are the column names in the Agency Input Workbooks, forced
  to lower case by getTemplateSheets()
*/
// prettier-ignore
const columnNameMap = {
  'Address Line 1': 'address line 1',
  'Address Line 2': 'address line 2',
  'Address Line 3': 'address line 3',
  'Award Amount': 'award amount',
  'Award Date': 'award date',
  'Award Description': 'award description',
  'Award Number': 'award number',
  'Award Payment Method': 'award payment method',
  'Category Description': 'category description',
  'City Name': 'city name',
  'Contract Amount': 'contract amount',
  'Contract Date': 'contract date',
  'Contract Description': 'contract description',
  'Contract Number': 'contract number',
  'Contract Type': 'contract type',
  'Cost or Expenditure Amount': 'cost or expenditure amount',
  'Cost or Expenditure Category': 'cost or expenditure category',
  'Country Name': 'country name',
  'Current Quarter Expenditure': 'current quarter expenditure',
  'Current Quarter Expenditure/Payments':
    'current quarter expenditure/payments',
  'Current Quarter Obligation': 'current quarter obligation',
  Description: 'description',
  'DUNS Number': 'duns number',
  'Expenditure End Date': 'expenditure end date',
  'Expenditure Project': 'project id',
  'Expenditure Start Date': 'expenditure start date',
  'Funding Type': 'funding type',
  'Identification Number': 'identification number',
  'Is awardee complying with terms and conditions of the grant?': 'compliance',
  'Legal Name': 'legal name',
  'Loan Amount': 'loan amount',
  'Loan Category': 'loan category',
  'Loan Date': 'loan date',
  'Loan Description': 'loan description',
  'Loan Expiration Date': 'loan expiration date',
  'Loan Number': 'loan number',
  'Non-Compliance Explanation': 'compliance explanation',
  'Obligation Amount': 'obligation amount',
  'Obligation Date': 'obligation date',
  'Obligation Project': 'project id',
  'Organization Type': 'organization type',

  // 20 12 16 was commented out - why? Needed for Loans tab
  'Payment Amount': 'total payment amount',

  'Payment Date': 'payment date',
  'Payment Project': 'project id',
  'Period of Performance End Date': 'period of performance end date',
  'Period of Performance Start Date': 'period of performance start date',
  'Primary Place of Performance Address Line 1':
    'primary place of performance address line 1',
  'Primary Place of Performance Address Line 2':
    'primary place of performance address line 2',
  'Primary Place of Performance Address Line 3':
    'primary place of performance address line 3',
  'Primary Place of Performance City Name':
    'primary place of performance city name',
  'Primary Place of Performance Country Name':
    'primary place of performance country name',
  'Primary Place of Performance State Code':
    'primary place of performance state code',
  'Primary Place of Performance Zip+4': 'primary place of performance zip',
  'Prime Recipient DUNS #': 'prime recipient duns #',
  Program: 'program',
  'Project Identification Number': 'project identification number',
  'Project Name': 'project name',
  'Purpose Description': 'purpose description',
  'Report Name': 'report name',
  'Reporting Period End Date': 'reporting period end date',
  'Reporting Period Start Date': 'reporting period start date',
  'State Code': 'state code',
  Status: 'status',
  'Sub-Recipient Organization (Contractor)': 'subrecipient id',
  'Sub-Recipient Organization (Payee)': 'subrecipient id',
  'Sub-Recipient Organization (Awardee)': 'subrecipient id',
  'Sub-Recipient Organization (Borrower)': 'subrecipient id',
  'Sub-Recipient Organization (Transferee/Government Unit)': 'subrecipient id',
  // bug fix kluge - see columnAliases/"transfer amount"
  'Transfer Amount': 'award amount',
  'Transfer Date': 'transfer date',
  'Transfer Number': 'transfer number',
  'Transfer Type': 'transfer type',
  'Will these payments be repurposed for Future Use?':
    'will these payments be repurposed for future use?',
  'Zip+4': 'zip'
  // "Primary Place of Performance Zip+4": "primary place of performance zip+4",
  // "Expenditure Project":"total expenditure amount",
}

// prettier-ignore
const columnTypeMap = {
  // treasury output sheet mappings
  'Address Line 1': 'string',
  'Address Line 2': 'string',
  'Address Line 3': 'string',
  'Award Amount': 'amount',
  'Award Date': 'date',
  'Award Description': 'string',
  'Award Number': 'string',
  'Award Payment Method': 'string',
  'Category Description': 'string',
  'City Name': 'string',
  'Contract Amount': 'amount',
  'Contract Date': 'date',
  'Contract Description': 'string',
  'Contract Number': 'string',
  'Contract Type': 'string',
  'Cost or Expenditure Amount': 'amount',
  'Cost or Expenditure Category': 'string',
  'Country Name': 'string',
  'Current Quarter Expenditure': 'amount',
  'Current Quarter Expenditure/Payments': 'amount',
  'Current Quarter Obligation': 'amount',
  Description: 'string',
  'DUNS Number': 'string',
  'Expenditure End Date': 'date',
  'Expenditure Project': 'string',
  'Expenditure Start Date': 'date',
  'Funding Type': 'string',
  'Identification Number': 'string',
  'Is awardee complying with terms and conditions of the grant?': 'string',
  'Legal Name': 'string',
  'Loan Amount': 'amount',
  'Loan Category': 'string',
  'Loan Date': 'date',
  'Loan Description': 'string',
  'Loan Expiration Date': 'date',
  'Loan Number': 'string',
  'Non-Compliance Explanation': 'string',
  'Obligation Amount': 'amount',
  'Obligation Date': 'date',
  'Obligation Project': 'string',
  'Organization Type': 'string',
  'Payment Amount': 'amount',
  'Payment Date': 'date',
  'Payment Project': 'string',
  'Period of Performance End Date': 'date',
  'Period of Performance Start Date': 'date',
  'Primary Place of Performance Address Line 1': 'string',
  'Primary Place of Performance Address Line 2': 'string',
  'Primary Place of Performance Address Line 3': 'string',
  'Primary Place of Performance City Name': 'string',
  'Primary Place of Performance Country Name': 'string',
  'Primary Place of Performance State Code': 'string',
  'Primary Place of Performance Zip+4': 'string',
  'Prime Recipient DUNS #': 'string',
  Program: 'string',
  'Project Identification Number': 'string',
  'Project Name': 'string',
  'Purpose Description': 'string',
  'Report Name': 'string',
  'Reporting Period End Date': 'date',
  'Reporting Period Start Date': 'date',
  'State Code': 'string',
  Status: 'string',
  'Sub-Recipient Organization (Contractor)': 'string',
  'Sub-Recipient Organization (Payee)': 'string',
  'Sub-Recipient Organization (Awardee)': 'string',
  'Sub-Recipient Organization (Borrower)': 'string',
  'Sub-Recipient Organization (Transferee/Government Unit)': 'string',
  'Transfer Amount': 'amount',
  'Transfer Date': 'date',
  'Transfer Number': 'string',
  'Transfer Type': 'string',
  'Will these payments be repurposed for Future Use?': 'string',
  'Zip+4': 'string',

  // input sheet mappings
  'address line 1': 'string',
  'address line 2': 'string',
  'address line 3': 'string',
  'award amount': 'amount',
  'award date': 'date',
  'award description': 'string',
  'award number': 'string',
  'award payment method': 'string',
  'category description': 'string',
  'city name': 'string',
  'compliance explanation': 'string',
  compliance: 'string',
  'contract amount': 'amount',
  'contract date': 'date',
  'contract description': 'string',
  'contract number': 'string',
  'contract type': 'string',
  'cost or expenditure amount': 'amount',
  'cost or expenditure category': 'string',
  'country name': 'string',
  'current quarter expenditure': 'amount',
  'current quarter expenditure/payments': 'amount',
  'current quarter obligation': 'amount',
  description: 'string',
  'duns number': 'string',
  'expenditure end date': 'date',
  'expenditure start date': 'date',
  'funding type': 'string',
  'identification number': 'string',
  'legal name': 'string',
  'loan amount': 'amount',
  'loan category': 'string',
  'loan date': 'date',
  'loan description': 'string',
  'loan expiration date': 'date',
  'loan number': 'string',
  'obligation amount': 'amount',
  'obligation date': 'date',
  'organization type': 'string',
  'payment date': 'date',
  'period of performance end date': 'date',
  'period of performance start date': 'date',
  'primary place of performance address line 1': 'string',
  'primary place of performance address line 2': 'string',
  'primary place of performance address line 3': 'string',
  'primary place of performance city name': 'string',
  'primary place of performance country name': 'string',
  'primary place of performance state code': 'string',
  'primary place of performance zip': 'string',
  'prime recipient duns #': 'string',
  program: 'string',
  'project id': 'string',
  'project identification number': 'string',
  'project name': 'string',
  'purpose description': 'string',
  'report name': 'string',
  'reporting period end date': 'date',
  'reporting period start date': 'date',
  'state code': 'string',
  status: 'string',
  'subrecipient id': 'string',
  'total payment amount': 'amount',
  'transfer date': 'date',
  'transfer number': 'string',
  'transfer type': 'string',
  'will these payments be repurposed for future use?': 'string',
  zip: 'string'
}

// columnAliases are needed by the test fixtures, which have old versions of
// the column names.
// Keys are the column names in the input spreadsheets, values are what
// they are called in the document records of the database.
const columnAliases = {
  'duns number (hidden)': 'duns number',
  'subrecipient id (hidden)': 'subrecipient id',
  'subrecipient organization': 'subrecipient legal name',
  'subrecipient organization name': 'subrecipient legal name',
  'subrecipient organization (borrower)': 'subrecipient legal name',
  'subrecipient organization (transferee/government unit)':
    'subrecipient legal name',
  'transfer amount': 'award amount',
  'is awardee complying with terms and conditions of the grant?': 'compliance',
  'awardee primary place of performance address line 1':
    'primary place of performance address line 1',
  'awardee primary place of performance address line 2':
    'primary place of performance address line 2',
  'awardee primary place of performance address line 3':
    'primary place of performance address line 3'
}

// categoryMap keys are column names in the Agency Data Input Spreadsheet
// forced to lower case by getTemplateSheets(). Values go in in the category
// column of the Treasury Data Output Spreadsheet.
// Each row in the agency data input spreadsheet has a column for each of
// these categories, which contains a dollar amount or is left blank. So a
// single row of the input spreadsheet can contain multiple dollar amounts.
// In the Treasury data output spreadsheet each of these dollar amounts is
// given a row of its own, and a category. The category is found in this
// categoryMap, keyed by the input spreadsheet column name.
//
// See also src/server/services/validate-data/expenditure-categories.js
//
// List from Treasury Data Dictionary
//   Administrative Expenses
//   Budgeted Personnel and Services Diverted to a Substantially Different Use
//   COVID-19 Testing and Contact Tracing
//   Economic Support (Other than Small Business, Housing, and Food Assistance)
//   Expenses Associated with the Issuance of Tax Anticipation Notes
//   Facilitating Distance Learning
//   Food Programs
//   Housing Support
//   Improve Telework Capabilities of Public Employees
//   Medical Expenses
//   Nursing Home Assistance
//   Payroll for Public Health and Safety Employees
//   Personal Protective Equipment
//   Public Health Expenses
//   Small Business Assistance
//   Unemployment Benefits
//   Workers' Compensation
//   Items Not Listed Above

// prettier-ignore
const categoryMap = {
  'administrative expenses': 'Administrative Expenses',
  'budgeted personnel and services diverted to a substantially different use':
    'Budgeted Personnel and Services Diverted to a Substantially Different Use',
  'covid-19 testing and contact tracing': 'COVID-19 Testing and Contact Tracing',
  'economic support (other than small business, housing, and food assistance)':
    'Economic Support (Other than Small Business, Housing, and Food Assistance)',
  'expenses associated with the issuance of tax anticipation notes':
    'Expenses Associated with the Issuance of Tax Anticipation Notes',
  'facilitating distance learning': 'Facilitating Distance Learning',
  'food programs': 'Food Programs',
  'housing support': 'Housing Support',
  'improve telework capabilities of public employees':
    'Improve Telework Capabilities of Public Employees',
  'medical expenses': 'Medical Expenses',
  'nursing home assistance': 'Nursing Home Assistance',
  'payroll for public health and safety employees':
    'Payroll for Public Health and Safety Employees',
  'personal protective equipment': 'Personal Protective Equipment',
  'public health expenses': 'Public Health Expenses',
  'small business assistance': 'Small Business Assistance',
  'unemployment benefits': 'Unemployment Benefits',
  'workers’ compensation': 'Workers Compensation',
  'other expenditure amount': 'Items Not Listed Above',
  'other expenditure categories': 'Category Description'
}

const categoryDescriptionSourceColumn = 'other expenditure categories'

const expenditureColumnNames = {
  Contracts: {
    amount: 'Cost or Expenditure Amount',
    category: 'Cost or Expenditure Category',
    description: 'Category Description',
    project: 'Expenditure Project',
    start: 'Expenditure Start Date',
    end: 'Expenditure End Date'
  },
  Grants: {
    amount: 'Cost or Expenditure Amount',
    category: 'Cost or Expenditure Category',
    description: 'Category Description',
    project: 'Expenditure Project',
    start: 'Expenditure Start Date',
    end: 'Expenditure End Date'
  },
  Loans: {
    amount: 'Payment Amount',
    category: 'Loan Category',
    description: 'Category Description',
    project: 'Payment Project',
    start: 'Payment Date',
    end: 'Payment Date'
  },
  Transfers: {
    amount: 'Cost or Expenditure Amount',
    category: 'Cost or Expenditure Category',
    description: 'Category Description',
    project: 'Expenditure Project',
    start: 'Expenditure Start Date',
    end: 'Expenditure End Date'
  },
  Direct: {
    amount: 'Cost or Expenditure Amount',
    category: 'Cost or Expenditure Category',
    description: 'Category Description',
    project: 'Expenditure Project',
    start: 'Expenditure Start Date',
    end: 'Expenditure End Date'
  }
}

/* subrecipientOrganizationType maps a change in the 20 11 30  treasury
  template - issue #81
  */
// prettier-ignore
const organizationTypeMap =
{
  'State Government': 'State Government',
  'County Government': 'County Government',
  'City or Township Government': 'City or Township Government',
  'Special District Government': 'Special District Government',
  'Independent School District': 'Independent School District',
  'Public/State Controlled Institution of Higher Education':
    'Public/State Controlled Institution of Higher Education',
  'Indian/Native American Tribal Government (Federally Recognized)':
    'Indian/Native American Tribal Government (Federally Recognized)',
  'Indian/Native American Tribal Designated Organization':
    'Indian/Native American Tribal Designated Organization',
  'Public/Indian Housing Authority': 'Public/Indian Housing Authority',
  'Nonprofit with 501C3 IRS Status (Other than IHE)':
    'Nonprofit with 501C3 IRS Status (Other than an Institution of Higher Education)',
  'Nonprofit without 501C3 IRS Status (Other than IHE)':
    'Nonprofit without 501C3 IRS Status (Other than an Institution of Higher Education)',
  'Private Institution of Higher Education':
    'Private Institution of Higher Education',
  'For-Profit Organization (Other than Small Business)':
    'For-Profit Organization (Other than Small Business)',
  'Small Business': 'Small Business',
  'Hispanic-serving Institution': 'Hispanic-serving Institution',
  'Historically Black College or University (HBCU)':
    'Historically Black College or University (HBCU)',
  'Tribally Controlled College or University (TCCU)':
    'Tribally Controlled College or University (TCCU)',
  'Alaska Native and Native Hawaiian Serving Institutions':
    'Alaska Native and Native Hawaiian Serving Institutions',
  'Non-domestic (non-U.S.) Entity':
    'Non-domestic (non-U.S.) Entity',
  Other: 'Other'
}

/* added 21 01 13 in response to ohio request:

  "When an adjustment is made to reduce a previous payment to remove
  it/completely reduce it, the output should be $0 (not blank)
  "See examples on Direct tab, Obligation Amount
  "Excel lines: 8, 107, 123, 274, 283, 333, 394
  "I think this methodology would carry through for Contract Amount, Award
  Amount, and Transfer Amount."
  */
const zeroWhenEmpty = {
  'Obligation Amount': true,
  'Contract Amount': true,
  'Award Amount': true,
  'Transfer Amount': true,
  'Loan Amount': true
}

module.exports = {
  categoryDescriptionSourceColumn,
  categoryMap,
  expenditureColumnNames,
  columnAliases,
  columnNameMap,
  columnTypeMap,
  organizationTypeMap,
  sheetNameAliases,
  sheetNameMap,
  zeroWhenEmpty
}
