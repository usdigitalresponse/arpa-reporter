const configureAPI = require('./src/server/configure')

module.exports = {
  devServer: {
    onBeforeSetupMiddleware: ({ app }) => configureAPI(app)
  }
}
