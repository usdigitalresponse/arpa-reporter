require('dotenv').config()

exports.seed = async function (knex) {
  await knex('application_settings').del()
  await knex('application_settings').insert([
    { tenant_id: 0, title: 'Rhode Island', current_reporting_period_id: 1 },
    { tenant_id: 1, title: 'California', current_reporting_period_id: 22 }
  ])
}
