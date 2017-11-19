const express = require('express')
const router = express.Router()
const config = require('../config')
const ObjectStorage = require('../lib/object-storage')
const axios = rquire('axios')

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

// Initialize Auth Service
let authServiceUrl = ''
let authToken = ''
dns.lookup(config.AUTH_SERVICE_DNS, (err, address, family) => {
  cosServiceUrl = 'http://' + address
  console.log(config.AUTH_SERVICE_DNS, authServiceUrl)

  // authenticate service
  axios.post(authServiceUrl + '/authenticate', {
    email: config.AUTH_SERVICE_ADMIN_EMAIL,
    password: config.AUTH_SERVICE_ADMIN_PASSWORD
  })
    .then(res => {
      authToken = res.body.token
      console.log('Service is authenticated. Token = ' + authToken)
    })
    .catch(err => {
      console.error(err)
    })
})

// Initialize Object Storage
const objectStorage = new ObjectStorage(storageConfig, 'images')
objectStorage.initialize().then(() => {
  console.log('Object Storage is ready.')
}).catch(err => {
  console.error('Object Storage Initialization', err)
})

// abstract away to its own Node module
const isAdmin = req => {
  return new Promise((resolve, reject) => {
    const authHeader = req.header('Authorization')

    if (!authHeader) {
      return reject('Missing Authorization Header')
    }

    const authorizationHeaderSplitBySpace = authHeader.split(' ')
    const token = authorizationHeaderSplitBySpace.length > 1
      ? authorizationHeaderSplitBySpace[1]
      : authorizationHeaderSplitBySpace[0]

    axios.post(authServiceUrl + '/verify', {
      token,
      isAdmin: true
    }).then(() => resolve(true))
      .catch(err => resolve(false))
  })
}

// Get object
router.get('/:filename', (req, res) => {
  const filename = req.params.filename
  const stream = objectStorage.download(filename)
  stream.pipe(res)
})

// Save object
router.post('/', isAdmin, (req, res) => {
  objectStorage.upload(req).then(file => {
    res.sendStatus(201)
  }).catch(err => {
    console.error('File Upload', err)
    res.sendStatus(500)
  })
})

module.exports = router
