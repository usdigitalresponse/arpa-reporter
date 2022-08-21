const { validateUpload } = require('./validate-upload')
const { uploadsInPeriod } = require('../db/uploads')

async function revalidateUploads (period, user, trns) {
  const uploads = await uploadsInPeriod(period.id, trns)

  const updates = []
  for (const upload of uploads) {
    const errors = await validateUpload(upload, user, trns)
    updates.push({
      upload,
      errors
    })
  }

  return updates
}

module.exports = { revalidateUploads }
