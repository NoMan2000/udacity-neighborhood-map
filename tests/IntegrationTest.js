/* globals describe, beforeEach, it, afterEach */
'use strict'
const Application = require('spectron').Application
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const assert = require('assert')

let electronPath = `${__dirname}/../node_modules/.bin/electron`

if (process.platform === 'win32') {
  electronPath += '.cmd'
}

let appPath = `${__dirname}/../`

const app = new Application({
  path: electronPath,
  args: [appPath]
})

const TEN_SEC = 10000

chai.should()
chai.use(chaiAsPromised)

describe('Start application', () => {
  'use strict'
  beforeEach(() => {
    return app.start()
  })
  afterEach(() => {
    return app.stop()
  })

  it('opens a window', () => {
    return app.client.waitUntilWindowLoaded()
      .getWindowCount().should.eventually.equal(1)
  }).timeout(TEN_SEC)

  it('tests the title', () => {
    return app.client.waitUntilWindowLoaded()
      .getTitle().should.eventually.equal('Location Storage')
  }).timeout(TEN_SEC)

  it('tests the size of the map element', () => {
    return app.client.waitUntilWindowLoaded()
      .getElementSize('#map', 'height')
      .then((height) => {
        assert.ok(height >= 400)
      })
  }).timeout(TEN_SEC)

  it('Will say Need more data on invalid result', () => {
    return app.client.waitUntilWindowLoaded()
      .setValue('#findLocation', '#')
      .then((value) => {
        return app.client.getText('#locationResult')
          .then((text) => {
            assert.equal('Need more data', text)
          })
      })
  }).timeout(TEN_SEC)
})
