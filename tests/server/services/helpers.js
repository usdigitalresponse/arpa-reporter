const fs = require('fs')
const path = require('path')

const knex = requireSrc(path.resolve(__dirname, '../db/connection'))

const makeUploadArgs = fixtureFile => {
  const filename = fixtureFile.match(/[^/]+$/)[0]
  return {
    filename: filename,
    user_id: 1,
    data: fs.readFileSync(fixtureFile)
  }
}

const resetUploadsAndDb = async () => {
  // await knex('subrecipients').truncate()
  await knex('validation_messages').del()
  await knex('uploads').del()
}

module.exports = { makeUploadArgs, resetUploadsAndDb }
