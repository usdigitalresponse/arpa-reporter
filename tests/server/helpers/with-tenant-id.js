const { requestProviderMiddleware } = require('../../../src/server/use-request')

/**
 * Runs a callback function in the context of an AsyncLocalStorage store
 * containing the supplied teant_id.
 * @param {string} tenantId
 * @param {Function} callback
 * @returns {Promise}
 * A promise that resolves to the return value of the callback, if any.
 */
async function withTenantId (tenantId, callback) {
  return new Promise(resolve => {
    requestProviderMiddleware(
      { session: { user: { tenant_id: tenantId } } },
      null,
      () => resolve(callback())
    )
  })
}

module.exports = {
  withTenantId
}
