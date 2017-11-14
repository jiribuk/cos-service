const express = require('express')
const router = express.Router()
const config = require('../config')
const ObjectStorage = require('../lib/object-storage')

const storageConfig = {
  provider: 'openstack',
  useServiceCatalog: true,
  useInternal: false,
  keystoneAuthVersion: 'v3',
  authUrl: config.COS_AUTH_URL,
  tenantId: config.COS_PROJECT_ID,
  domainId: config.COS_DOMAIN_ID,
  username: config.COS_USERNAME,
  password: config.COS_PASSWORD,
  region: 'dallas'
}

const objectStorage = new ObjectStorage(storageConfig, 'images')
objectStorage.initialize().then(() => {
  console.log('Object Storage is ready.')
}).catch(err => {
  console.error('Object Storage Initialization', err)
})

router.get('/:filename', (req, res) => {
  const filename = req.params.filename
  const stream = objectStorage.download(filename)
  stream.pipe(res)
})

router.post('/', (req, res) => {
  objectStorage.upload(req).then(file => {
    res.sendStatus(201)
  }).catch(err => {
    console.error('File Upload', err)
    res.sendStatus(500)
  })
})

module.exports = router
