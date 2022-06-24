const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')
const history = require('connect-history-api-fallback')
const morgan = require('morgan')
const { resolve } = require('path')

const environment = require('./environment')

const publicPath = resolve(__dirname, '../../dist')
const staticConf = { maxAge: '1y', etag: false }

module.exports = (app, options = {}) => {
  if (!options.disableRequestLogging) {
    app.use(morgan('common'))
  }
  app.use(bodyParser.json())
  app.use(cookieParser(environment.COOKIE_SECRET))

  app.use('/api/agencies', require('./routes/agencies'))
  app.use(
    '/api/application_settings',
    require('./routes/application_settings')
  )
  app.use('/api/exports', require('./routes/exports'))
  app.use('/api/subrecipients', require('./routes/subrecipients'))
  app.use('/api/reporting_periods', require('./routes/reporting-periods'))
  app.use('/api/sessions', require('./routes/sessions'))
  app.use('/api/audit_report', require('./routes/audit-report'))
  app.use('/api/uploads', require('./routes/uploads'))
  app.use('/api/users', require('./routes/users'))
  app.use('/api/health', require('./routes/health'))

  if (!environment.IS_DEV) {
    const staticMiddleware = express.static(publicPath, staticConf)
    app.use(staticMiddleware)
    app.use(
      history({
        disableDotRule: true,
        verbose: true
      })
    )
    app.use(staticMiddleware)
  }
}
