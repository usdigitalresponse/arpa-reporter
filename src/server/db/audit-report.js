/* eslint camelcase: 0 */

/*
--------------------------------------------------------------------------------
-                           db/audit-report.js
--------------------------------------------------------------------------------

*/
const knex = require('./connection')

module.exports = {
  getAggregateAwardData,
  getAggregatePaymentData,
  getProjectSummaryData,
  getAwardData
}

async function getAwardData (type, trns = knex) {
  const q = {
    contracts: {
      number: 'contract number',
      amount: 'contract amount',
      expenditure: 'total expenditure amount'
    },

    grants: {
      number: 'award number',
      amount: 'award amount',
      expenditure: 'total expenditure amount'
    },

    loans: {
      number: 'loan number',
      amount: 'loan amount',
      expenditure: 'payment amount'
    },

    transfers: {
      number: 'transfer number',
      amount: 'award amount',
      expenditure: 'total expenditure amount'
    },

    direct: {
      number: 'obligation date',
      amount: 'obligation amount',
      expenditure: 'total expenditure amount'
    }
  }[type]

  const query = `
    select
      a.code as agency,
      p.code as project,
      d.content->>'subrecipient id' as subrecipient_id,
      d.content->>'${q.number}' as award_number,
      u.reporting_period_id,
      d.type,
      r.legal_name,
      d.content->>'${q.amount}' as award_amount,
      d.content->>'current quarter obligation' as current_obligation,
      d.content->>'${q.expenditure}' as current_expenditure

    from documents as d
    left join uploads as u on d.upload_id = u.id
    left join projects as p on p.id = u.project_id
    left join agencies as a on a.id = u.agency_id
    left join subrecipients as r on
      r.identification_number = d.content->>'subrecipient id'
    where d.type='${type}'
    order by
      a.code,
      p.code,
      d.content->>'${q.number}',
      d.content->>'subrecipient id',
      u.reporting_period_id
    ;`

  const result = await trns.raw(query)
  return result.rows
}

async function getAggregateAwardData (trns = knex) {
  const result = await trns.raw(`
    select
      a.code as Agency,
      p.code as Project,
      u.reporting_period_id,
      d.content->>'funding type' as funding_type,
      d.content->>'current quarter obligation' as obligation,
      d.content->>'current quarter expenditure/payments' as expenditure
    from documents as d
    left join uploads as u on d.upload_id = u.id
    left join projects as p on p.id = u.project_id
    left join agencies as a on a.id = u.agency_id
    where d.type='aggregate awards < 50000'
    order by
      a.code,
      p.code,
      d.content->>'funding type'
    ;`
  )
  return result.rows
}

async function getAggregatePaymentData (trns = knex) {
  const result = await trns.raw(`
    select
      a.code as Agency,
      p.code as Project,
      u.reporting_period_id,
      d.content->>'current quarter obligation' as obligation,
      d.content->>'current quarter expenditure' as expenditure
    from documents as d
    left join uploads as u on d.upload_id = u.id
    left join projects as p on p.id = u.project_id
    left join agencies as a on a.id = u.agency_id
    where d.type='aggregate payments individual'
    order by
      p.code
    ;`
  )
  return result.rows
}

async function getProjectSummaryData (trns = knex) {
  const result = await trns.raw(`
    select
      a.code as Agency,
      p.code as Project,
      p.name as name,
      p.description as description,
      p.status as status,
      u.reporting_period_id,
      d.type,
      d.content->>'contract number' as contract_number,
      d.content->>'award number' as award_number,
      d.content->>'loan number' as loan_number,
      d.content->>'transfer number' as transfer_number,
      d.content->>'obligation date' as obligation_date,
      d.content->>'subrecipient id' as subrecipient_id,
      d.content->>'current quarter obligation' as obligation,
      d.content->>'total expenditure amount' as expenditure,
      d.content->>'payment amount' as l_expenditure,
      d.content->>'current quarter expenditure/payments' as aa_expenditure,
      d.content->>'current quarter expenditure' as ap_expenditure
    from documents as d
    left join uploads as u on d.upload_id = u.id
    left join projects as p on p.id = u.project_id
    left join agencies as a on a.id = u.agency_id
    where d.type in (
      'contracts',
      'grants',
      'loans',
      'transfers',
      'direct',
      'aggregate awards < 50000',
      'aggregate payments individual'
    )
    order by
      a.code,
      p.code,
      subrecipient_id,
      contract_number,
      award_number,
      loan_number,
      transfer_number,
      obligation_date,
      reporting_period_id
    ;`
  )
  return result.rows
}

/*                                 *  *  *                                    */
