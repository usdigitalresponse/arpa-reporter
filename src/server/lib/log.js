const { VERBOSE } = require('../environment')

/**
 * An alias for console.dir.
 *
 * This function is a no-op if process.env.VERBOSE is not set.
 *
 * @param {...*} messages
 */
let dir = (...messages) => {}
if (VERBOSE) {
  dir = console.dir
}

/**
 * An alias for console.log.
 *
 * This function is a no-op if process.env.VERBOSE is not set.
 *
 * @param {...*} messages
 */
let log = (...messages) => {}
if (VERBOSE) {
  log = console.log
}

module.exports = {
  dir,
  log
}
