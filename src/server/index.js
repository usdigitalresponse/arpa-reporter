const Sentry = require('@sentry/node')
const Tracing = require('@sentry/tracing')
const express = require('express')

// This patches Express to better handle errors thrown in async functions, which are otherwise not
// handled. It just calls next(err) with them.
require('express-async-errors')

const configureAPI = require('./configure')
const environment = require('./environment')

console.log(`Database is ${environment.POSTGRES_URL}`)

const app = express()

Sentry.init({
  dsn: 'https://b335d8c824514b869add7d29f2c258ed@o1325758.ingest.sentry.io/6591526',
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app })
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0
})

configureAPI(app)

app.use(Sentry.Handlers.errorHandler())

// Optional fallthrough error handler
app.use(function onError (err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500
  res.end(res.sentry + '\n')
})

app.listen(environment.PORT, () =>
  console.log(`App running on port ${environment.PORT}!`)
)
