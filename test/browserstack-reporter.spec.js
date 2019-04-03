'use strict'

const chai = require('chai')
const sinon = require('sinon')
const BrowserStack = require('browserstack')
const BrowserStackReporter = require('../src/browserstack-reporter')
const expect = chai.expect

describe('BrowserStack Reporter', () => {
  let logManager, logger, client
  beforeEach(() => {
    logger = {
      debug: sinon.stub(),
      error: sinon.stub()
    }

    logManager = {
      create: () => logger
    }

    client = {
      updateSession: sinon.stub().callsFake((browser, data, callback) => {
        callback()
      })
    }

    sinon.stub(BrowserStack, 'createAutomateClient').returns(client)
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('function(onBrowserComplete)', () => {
    it('should update the browsers session', () => {
      const reporter = new BrowserStackReporter(logManager, {
        chrome: {
          browser: 'chrome',
          browser_version: '73'
        }
      })

      reporter.onBrowserComplete({
        launchId: 'chrome',
        lastResult: {
          disconnected: false,
          error: false,
          failed: false
        }
      })

      expect(client.updateSession.callCount).to.equal(1)
    })

    it('should support disconnected sessions', () => {
      const reporter = new BrowserStackReporter(logManager, {
        chrome: {
          browser: 'chrome',
          browser_version: '73'
        }
      })

      reporter.onBrowserComplete({
        launchId: 'chrome',
        lastResult: {
          disconnected: true,
          error: false,
          failed: false
        }
      })

      expect(client.updateSession.callCount).to.equal(1)
      expect(client.updateSession.firstCall.args[1]).to.deep.equal({
        status: 'error'
      })
    })

    it('should support failed sessions', () => {
      const reporter = new BrowserStackReporter(logManager, {
        chrome: {
          browser: 'chrome',
          browser_version: '73'
        }
      })

      reporter.onBrowserComplete({
        launchId: 'chrome',
        lastResult: {
          disconnected: false,
          error: false,
          failed: true
        }
      })

      expect(client.updateSession.callCount).to.equal(1)
      expect(client.updateSession.firstCall.args[1]).to.deep.equal({
        status: 'error'
      })
    })

    it('should support errored sessions', () => {
      const reporter = new BrowserStackReporter(logManager, {
        chrome: {
          browser: 'chrome',
          browser_version: '73'
        }
      })

      reporter.onBrowserComplete({
        id: 'chrome',
        lastResult: {
          disconnected: false,
          error: true,
          failed: false
        }
      })

      expect(client.updateSession.callCount).to.equal(1)
      expect(client.updateSession.firstCall.args[1]).to.deep.equal({
        status: 'error'
      })
    })

    it('should support errors from the BrowserStack API', () => {
      client.updateSession = sinon.stub().callsFake((browser, data, callback) => callback(new Error('What happened!')))

      const reporter = new BrowserStackReporter(logManager, {
        chrome: {
          browser: 'chrome',
          browser_version: '73'
        }
      })

      reporter.onBrowserComplete({
        launchId: 'chrome',
        lastResult: {
          disconnected: false,
          error: true,
          failed: false
        }
      })

      expect(client.updateSession.callCount).to.equal(1)
      expect(client.updateSession.firstCall.args[1]).to.deep.equal({
        status: 'error'
      })
    })

    it('should ignore if the browser is not in the sessionMapping', () => {
      client.updateSession = sinon.stub().callsFake((browser, data, callback) => callback(new Error('What happened!')))

      const reporter = new BrowserStackReporter(logManager, {})

      reporter.onBrowserComplete({
        launchId: 'chrome',
        lastResult: {}
      })

      expect(client.updateSession.callCount).to.equal(0)
    })
  })

  describe('function(onExit)', () => {
    it('should exit if there are no pending updates', (done) => {
      const reporter = new BrowserStackReporter(logManager, 'test')

      reporter.onExit(done)
    })
  })
})
