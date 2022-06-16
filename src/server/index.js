const express = require('express')
const configureAPI = require('./configure')
const environment = require('./environment')

console.log(`Database is ${environment.POSTGRES_URL}`)

const app = express()
configureAPI(app)

app.listen(
  environment.PORT,
  () => console.log(`App running on port ${environment.PORT}!`)
)
