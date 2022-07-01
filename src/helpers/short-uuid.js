
/**
 * Shorten a UUID to make it a little less intimidating when presented in a UI.
 * @param {string} uuid The UUID to shorten.
 */
export function shortUuid (uuid) {
  return uuid.split('-')[0]
}
