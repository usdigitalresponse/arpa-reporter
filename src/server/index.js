const express = require('express')

// This patches Express to better handle errors thrown in async functions, which are otherwise not
// handled. It just calls next(err) with them.
require('express-async-errors')

const configureAPI = require('./configure')

const { PORT = 3000 } = process.env
console.log(`Database is ${process.env.POSTGRES_URL}`)

const app = express()
configureAPI(app)

app.listen(PORT, () => console.log(`App running on port ${PORT}!`))
