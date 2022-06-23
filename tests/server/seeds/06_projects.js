require('dotenv').config()

// TODO(mbroussard): can we delete this? It seems like this table might be unused as of 6/23/2022

exports.seed = async function (knex) {
  await knex('projects').del()
  await knex('projects')
    .insert([

      {
        code: '075',
        name: 'Workforce Stabilization Loan Program Disbursements #1, #2, and #3',
        tenant_id: 0
      },
      {
        code: '1020',
        name: 'Workforce Stabilization Loan Program other projects',
        tenant_id: 0
      },
      {
        code: '078',
        name: 'Workforce Stabilization Loan Program',
        tenant_id: 0
      }
    ])
    .returning('id')
}
