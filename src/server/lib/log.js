/**
 * An alias for console.dir.
 *
 * This function is a no-op if process.env.VERBOSE is not set.
 *
 * @param {...*} messages
 */
let dir = (...messages) => {}
if (process.env.VERBOSE) {
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
if (process.env.VERBOSE) {
  log = console.log
}

module.exports = {
  dir,
  log
}
