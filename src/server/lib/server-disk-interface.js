const fs = require('fs').promises
const fsSync = require('fs')
const path = require('path')
const multer = require('multer')

const environment = require('../environment')

class ServerDiskInterface {
  constructor (uploadDirectory = environment.UPLOAD_DIR) {
    this.uploadDirectory = uploadDirectory
    try {
      if (!fsSync.existsSync(uploadDirectory)) {
        fsSync.mkdirSync(uploadDirectory)
        console.log(`Directory ${uploadDirectory} created.`)
      }
    } catch (err) {
      console.dir(err)
      return err
    }
  }

  upload () {
    return multer({ dest: this.uploadDirectory })
  }

  async listFiles () {
    return fs.readdir(this.uploadDirectory)
  }

  async readFile (fname) {
    return fs.readFile(path.join(this.uploadDirectory, fname))
  }

  async writeFile (fname, data) {
    return fs.writeFile(path.join(this.uploadDirectory, fname), data)
  }

  // Write only if file doesn't exist.
  async writeFileCarefully (fname, data) {
    const fh = await fs.open(path.join(this.uploadDirectory, fname), 'wx')
    const written = await fh.write(data)
    await fh.close()
    return written
  }

  async rmFile (fname) {
    return fs.unlink(path.join(this.uploadDirectory, fname))
  }
}

module.exports = ServerDiskInterface
