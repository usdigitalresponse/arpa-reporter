require('dotenv').config()

exports.seed = async function (knex) {
  await knex('reporting_periods').del()
  await knex('reporting_periods').insert([
    {
      name: 'September, 2020',
      start_date: '2020-03-01',
      end_date: '2020-09-30',
      period_of_performance_end_date: '2020-12-30',
      open_date: '2020-12-01',
      close_date: '2020-12-01',
      review_period_start_date: '2020-12-16',
      review_period_end_date: '2020-12-23',

      reporting_template: 'empty-template.xlsx'
    },
    {
      name: 'December, 2020',
      start_date: '2020-10-01',
      end_date: '2020-12-31',
      period_of_performance_end_date: '2020-12-30',
      open_date: '2020-12-25',
      close_date: '2021-01-11',
      review_period_start_date: '2021-01-12',
      review_period_end_date: '2021-01-20',
      reporting_template: 'empty-template.xlsx',

      validation_rule_tags: ['cumulative']
    },
    {
      name: 'March, 2021',
      start_date: '2021-01-01',
      end_date: '2021-03-31',
      period_of_performance_end_date: '2020-12-30',
      open_date: '2021-01-22',
      close_date: '2021-04-12',
      review_period_start_date: '2021-04-13',
      review_period_end_date: '2021-04-20',
      reporting_template: 'empty-template.xlsx'
    },
    {
      name: 'June, 2021',
      start_date: '2021-04-01',
      end_date: '2021-06-30',
      period_of_performance_end_date: '2020-12-30',
      open_date: '2021-04-22',
      close_date: '2021-07-12',
      review_period_start_date: '2021-07-13',
      review_period_end_date: '2021-07-20',
      reporting_template: 'empty-template.xlsx'
    },
    {
      name: 'September, 2021',
      start_date: '2021-07-01',
      end_date: '2021-09-30',
      period_of_performance_end_date: '2020-12-30',
      open_date: '2021-07-22',
      close_date: '2021-10-12',
      review_period_start_date: '2021-10-13',
      review_period_end_date: '2021-10-20',
      reporting_template: 'empty-template.xlsx'
    }
  ])
    .returning('id')
}
