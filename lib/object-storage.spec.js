require('chai').should()
const expect = require('chai').expect
const fs = require('fs')
const http = require('http')
const config = require('../config')

const ObjectStorage = require('./object-storage')
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
beforeEach(done => {
  objectStorage.initialize().then(() => {
    done()
  })
})

describe('Object Storage', function () {
  // before(done => {
  //   // arrange
  //   const text = fs.readFileSync('./craigslist-properties.text', { encoding: 'utf8'})
  //   craiglistData = JSON.parse(text)
  // })

  it.only('should upload a file', function (done) {
    // arrange
    const imageUrl = 'http://www.volusia.com/wp-content/uploads/2013/07/news.jpg'
    http.get(imageUrl, res => {
      // act
      objectStorage.upload(res).then(file => {
        console.log(file)
      }).catch(err => {
        console.error(err)
      })
    })
  })

  it('should download a file', function (done) {
    // arrange
    const filename = '809b6370-c985-11e7-adf4-4d03dccb273f'
    const stream = objectStorage.download(filename)
    console.log(stream)
  })
})
