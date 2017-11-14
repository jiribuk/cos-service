const pkgcloud = require('pkgcloud')
const uuid = require('node-uuid')
const path = require('path')

class ObjectStorage {
  constructor (storageConfig, containerName) {
    this.storageClient = pkgcloud.storage.createClient(storageConfig)
    this.containerName = containerName
    this.container = undefined
  }

  initialize () {
    return this._authenticate().then(() => {
      return this._ensureContainer(this.containerName).then(container => {
        this.container = container
      })
    })
  }

  _authenticate () {
    return new Promise((resolve, reject) => {
      this.storageClient.auth(err => {
        if (err) {
          reject(err)
        }else {
          resolve(this.storageClient._identity)
        }
      })
    })
  }

  _ensureContainer (containerName) {
    return this._getContainer(containerName).catch(err => {
      if (err.statusCode === 404) {
        return this._createContainer(containerName)
      } else {
        return Promise.reject(err)
      }
    })
  }

  _getContainer (containerName) {
    return new Promise((resolve, reject) => {
      this.storageClient.getContainer(containerName, (err, container) => {
        if (err) {
          reject(err)
        } else {
          resolve(container)
        }
      })
    })
  }

  _createContainer (conatainerName) {
    return new Promise((resolve, reject) => {
      this.storageClient.createContainer({
        name: conatainerName
      }, (err, container) => {
        if (err) {
          reject(err)
        } else {
          resolve(container)
        }
      })
    })
  }

  download (filename) {
    const stream = this.storageClient.download({
      container: this.containerName,
      remote: filename
    })

    return stream
  }

  upload (stream, contentType, filename) {
    filename = filename || uuid.v1()
    if (!contentType) {
      if (!stream.headers || !stream.headers['content-type']) {
        throw new Error('Object Storage - Upload - Bad Request - Content Type was not specified.')
      } else {
        contentType = stream.headers['content-type']
      }
    }

    return new Promise((resolve, reject) => {
      const upload = this.storageClient.upload({
        container: this.containerName,
        remote: filename,
        contentType: contentType
      })

      upload.on('error', err => {
        reject(err)
      })

      upload.on('success', file => {
        resolve(file)
      })

      stream.pipe(upload)
    })
  }
}

module.exports = ObjectStorage
