const express = require('express')

// This patches Express to better handle errors thrown in async functions, which are otherwise not
// handled. It just calls next(err) with them.
require('express-async-errors')

const configureAPI = require('./configure')
const environment = require('./environment')

console.log(`Database is ${environment.POSTGRES_URL}`)

const app = express()
configureAPI(app)

app.listen(
  environment.PORT,
  () => console.log(`App running on port ${environment.PORT}!`)
)
