const { AsyncLocalStorage } = require('node:async_hooks')

const requestStorage = new AsyncLocalStorage()

/**
 * An express middleware. Captures the request in AsyncLocalStorage for later
 * retrieval.
 */
function requestProviderMiddleware (req, res, next) {
  requestStorage.run(req, next)
}

/**
 * Get the request object currently being handled by express.
 * @returns {Request}
 */
function useRequest () {
  return requestStorage.getStore()
}

/** A shortcut helper to get at tenant_id directly */
function useTenantId () {
  return useRequest().session.user.tenant_id
}

module.exports = {
  requestProviderMiddleware,
  useRequest,
  useTenantId
}
