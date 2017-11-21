const express = require('express')
const router = express.Router()
const config = require('../config')
const ObjectStorage = require('../lib/object-storage')
const axios = require('axios')
const dns = require('dns')

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
const authenticate = () => {
  console.log('Authentication started')
  dns.lookup(config.AUTH_SERVICE_DNS, (err, address, family) => {
    axios.defaults.headers.post['Content-Type'] = 'application/json'
    axios.defaults.baseURL = 'http://' + address
    console.log(config.AUTH_SERVICE_DNS, axios.defaults.baseURL)

    // authenticate service
    axios.post('/authenticate', {
      email: config.AUTH_SERVICE_ADMIN_EMAIL,
      password: config.AUTH_SERVICE_ADMIN_PASSWORD
    })
      .then(res => {
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + res.body.token
        console.log('Service is authenticated. Token = ' + authToken)
      })
      .catch(err => {
        console.error(err)
      })
  })
}

authenticate()
setInterval(authenticate, 3600 * 100)

// Initialize Object Storage
const objectStorage = new ObjectStorage(storageConfig, 'images')
objectStorage.initialize().then(() => {
  console.log('Object Storage is ready.')
}).catch(err => {
  console.error('Object Storage Initialization', err)
})

// abstract away to its own Node module
const isAdmin = (req, res, next) => {
  return new Promise((resolve, reject) => {
    const authHeader = req.header('Authorization')

    if (!authHeader) {
      return reject('Missing Authorization Header')
    }

    const authorizationHeaderSplitBySpace = authHeader.split(' ')
    const token = authorizationHeaderSplitBySpace.length > 1
      ? authorizationHeaderSplitBySpace[1]
      : authorizationHeaderSplitBySpace[0]

    axios.post('/verify', {
      token,
      isAdmin: true
    }).then(() => next())
      .catch(err => res.sendStatus(403))
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
