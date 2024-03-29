const { isRunningInGOST } = require('../helpers/is_gost')

exports.seed = async function (knex) {
  const isGost = await isRunningInGOST(knex)

  // Deletes ALL existing entries
  return knex('roles')
    .del()
    .then(function () {
      // Inserts seed entries
      return knex('roles').insert([
        { name: 'admin', rules: {} },
        { name: isGost ? 'staff' : 'reporter', rules: {} }
      ])
    })
}
