require('dotenv').config()

// reporting periods loosely based on tables 3 and 4 from here:
// https://home.treasury.gov/system/files/136/SLFRF-Compliance-and-Reporting-Guidance.pdf
//
// when making changes to this file, consider also updating the test seed:
// tests/server/seeds/07_reporting_periods.js
exports.seed = async function (knex) {
  const [{ count }] = await knex('reporting_periods').count('name', { as: 'count' })
  if (count !== '0') {
    console.log(`db already has ${count} reporting periods...`)
    return
  }

  // first period is all of 2021
  const periods = [
    {
      name: 'Quarterly 1',
      start_date: '2021-03-03',
      end_date: '2021-12-31'
    }
  ]

  const moment = require('moment')
  const mstr = (mdate) => mdate.format('YYYY-MM-DD')

  // generate array of reporting periods, starting from right after the first period
  const start = moment(periods[0].end_date).add(1, 'days')
  const finalStart = moment('2026-10-01')
  while (!start.isAfter(finalStart)) {
    const end = start.clone().add(2, 'months').endOf('month')

    periods.push({
      name: `Quarterly ${periods.length + 1}`,
      start_date: mstr(start),
      end_date: mstr(end)
    })

    start.add(3, 'months')
  }

  await knex('reporting_periods').insert(periods)
}
