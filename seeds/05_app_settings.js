require('dotenv').config()

const title = (process.env.INITIAL_APP_TITLE || 'ARPA Reporter')

exports.seed = async function (knex) {
  const [{ count }] = await knex('application_settings').count('title', { as: 'count' })
  if (count !== '0') {
    console.log('db already has application settings...')
    return
  }

  const { firstPeriod } = await knex('reporting_periods').first('id AS firstPeriod')

  await knex('application_settings').insert([
    { title, current_reporting_period_id: firstPeriod }
  ])
}
