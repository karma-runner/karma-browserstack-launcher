'use strict'

const chai = require('chai')
const sinon = require('sinon')
const api = require('browserstack')
const browserstack = require('browserstack-local')
const KarmaBrowserStackLauncher = require('../src/karma-browserstack-launcher')
const manager = require('../src/worker-manager')
const expect = chai.expect

describe('karma-browserstack-launcher', () => {
  let logManager, logger, emitter, client
  beforeEach(() => {
    process.env = {}

    logger = {
      info: sinon.stub(),
      warn: sinon.stub(),
      debug: sinon.stub(),
      error: sinon.stub()
    }

    logManager = {
      create: () => logger
    }

    emitter = {
      on: sinon.stub(),
      emit: sinon.stub()
    }

    client = {
      start: sinon.stub().callsFake((args, callback) => callback()),
      stop: sinon.stub().callsFake((callback) => callback()),
      terminateWorker: sinon.stub().callsFake((id, callback) => callback())
    }

    sinon.stub(browserstack, 'Local').returns(client)
  })

  afterEach(() => {
    sinon.restore()
  })

  describe('function(createBrowserStackTunnel)', () => {
    const createBrowserStackTunnel = KarmaBrowserStackLauncher.browserStackTunnel[1]

    it('should create a BrowserStack tunnel...', () => {
      const promise = createBrowserStackTunnel(logManager, {
        browserStack: {
          accessKey: 'config-access-key'
        }
      }, emitter)

      expect(client.start.callCount).to.equal(1)
      expect(client.start.firstCall.args[0]).to.deep.equal({
        key: 'config-access-key'
      })

      return promise
    })

    it('should support "BROWSERSTACK_ACCESS_KEY"', () => {
      process.env.BROWSERSTACK_ACCESS_KEY = 'my-access-key'

      const promise = createBrowserStackTunnel(logManager, {}, emitter)

      expect(client.start.callCount).to.equal(1)
      expect(client.start.firstCall.args[0]).to.deep.equal({
        key: 'my-access-key'
      })

      return promise
    })

    it('should support "BROWSER_STACK_ACCESS_KEY"', () => {
      process.env.BROWSERSTACK_ACCESS_KEY = 'another-access-key'

      const promise = createBrowserStackTunnel(logManager, {}, emitter)

      expect(client.start.callCount).to.equal(1)
      expect(client.start.firstCall.args[0]).to.deep.equal({
        key: 'another-access-key'
      })

      return promise
    })

    it('should invoke stop on exit', (done) => {
      emitter.on = sinon.stub().callsFake((type, callback) => callback(done))

      createBrowserStackTunnel(logManager, {}, emitter)
    })
  })

  describe('function(createBrowserStackClient)', () => {
    const createBrowserStackClient = KarmaBrowserStackLauncher.browserStackClient[1]

    beforeEach(() => {
      sinon.stub(api, 'createClient')

      sinon.stub(manager, 'startPolling').callsFake((client, interval, callback) => callback())
    })

    it('should create a client', () => {
      const sessionMapping = {}
      createBrowserStackClient({
        username: 'example',
        accessKey: '12345'
      }, sessionMapping)

      expect(api.createClient.firstCall.args[0]).to.deep.equal({
        Local: true,
        username: 'example',
        password: '12345'
      })

      expect(sessionMapping).to.deep.equal({
        credentials: {
          username: 'example',
          password: '12345',
          proxy: undefined
        }
      })
    })

    it('should support clients with a custom proxy', () => {
      const sessionMapping = {}
      createBrowserStackClient({
        username: 'example',
        accessKey: '12345',
        proxyHost: 'google.com',
        proxyPort: 8081,
        proxyProtocol: 'https'
      }, sessionMapping)

      expect(sessionMapping).to.deep.equal({
        credentials: {
          username: 'example',
          password: '12345',
          proxy: 'https://google.com:8081'
        }
      })
    })

    it('should support clients with proxy authentication', () => {
      const sessionMapping = {}
      createBrowserStackClient({
        username: 'example',
        accessKey: '12345',
        proxyHost: 'google.com',
        proxyPort: 8081,
        proxyUser: 'username',
        proxyPass: 'password'
      }, sessionMapping)

      expect(sessionMapping).to.deep.equal({
        credentials: {
          username: 'example',
          password: '12345',
          proxy: 'http://username:password@google.com:8081'
        }
      })
    })

    it('should support config not being provided', () => {
      const sessionMapping = {}
      createBrowserStackClient(null, sessionMapping)

      expect(api.createClient.firstCall.args[0]).to.deep.equal({
        Local: true,
        username: undefined,
        password: undefined
      })

      expect(sessionMapping).to.deep.equal({
        credentials: {
          username: undefined,
          password: undefined,
          proxy: undefined
        }
      })
    })

    it('should support a disabled tunnel', () => {
      const sessionMapping = {}
      createBrowserStackClient({ startTunnel: false }, sessionMapping)

      expect(api.createClient.firstCall.args[0]).to.deep.equal({
        username: undefined,
        password: undefined
      })

      expect(sessionMapping).to.deep.equal({
        credentials: {
          username: undefined,
          password: undefined,
          proxy: undefined
        }
      })
    })

    it('should support "BROWSERSTACK_*"', () => {
      process.env.BROWSERSTACK_USERNAME = 'my-username'
      process.env.BROWSERSTACK_ACCESS_KEY = 'my-password'

      const sessionMapping = {}
      createBrowserStackClient({ startTunnel: false }, sessionMapping)

      expect(sessionMapping).to.deep.equal({
        credentials: {
          username: 'my-username',
          password: 'my-password',
          proxy: undefined
        }
      })
    })

    it('should support "BROWSER_STACK_*"', () => {
      process.env.BROWSER_STACK_USERNAME = 'my-other-username'
      process.env.BROWSER_STACK_ACCESS_KEY = 'my-other-password'

      const sessionMapping = {}
      createBrowserStackClient({ startTunnel: false }, sessionMapping)

      expect(sessionMapping).to.deep.equal({
        credentials: {
          username: 'my-other-username',
          password: 'my-other-password',
          proxy: undefined
        }
      })
    })
  })

  describe('BrowserStackBrowser', () => {
    const BrowserStackBrowser = KarmaBrowserStackLauncher['launcher:BrowserStack'][1]
    let tunnel, decorators
    beforeEach(() => {
      tunnel = Promise.resolve()

      decorators = {
        baseLauncher: sinon.stub(),
        captureTimeoutLauncher: sinon.stub(),
        retryLauncher: sinon.stub()
      }
    })

    describe('function(start)', () => {
      let browser, sessionMapping
      beforeEach(() => {
        sessionMapping = {}

        browser = new BrowserStackBrowser('example', emitter, {
          browser: 'chrome',
          browser_version: '73',
          os: 'Windows',
          os_version: '10'
        }, logManager, {
          captureTimeout: 1
        }, tunnel, client, decorators.baseLauncher, decorators.captureTimeoutLauncher, decorators.retryLauncher, sessionMapping)

        browser._done = sinon.stub()
      })

      it('should support starting a browser', (done) => {
        client.createWorker = sinon.stub().callsFake((settings, callback) => callback(null, {
          id: 'chrome',
          on: sinon.stub().callsFake((type, callback) => callback('running')),
          browser_url: 'https://google.com'
        }))

        browser.start('https://google.com')

        setTimeout(() => {
          expect(logger.debug.callCount).to.equal(1)
          done()
        })
      })

      it('should support queuing a browser', (done) => {
        client.createWorker = sinon.stub().callsFake((settings, callback) => callback(null, {
          id: 'chrome',
          on: sinon.stub().callsFake((type, callback) => callback('queue')),
          browser_url: 'https://google.com'
        }))

        browser.start('https://google.com')

        setTimeout(() => {
          expect(logger.debug.callCount).to.equal(1)
          done()
        })
      })

      it('should support deleting a browser', (done) => {
        client.createWorker = sinon.stub().callsFake((settings, callback) => callback(null, {
          id: 'chrome',
          on: sinon.stub().callsFake((type, callback) => callback('delete')),
          browser_url: 'https://google.com'
        }))

        browser.start('https://google.com')

        setTimeout(() => {
          expect(logger.debug.callCount).to.equal(1)
          done()
        })
      })

      it('should timeout', (done) => {
        client.createWorker = sinon.stub().callsFake((settings, callback) => callback(null, {
          id: 'chrome',
          on: sinon.stub().callsFake((type, callback) => callback('running')),
          browser_url: 'https://google.com'
        }))

        browser.start('https://google.com')

        emitter.emit = (type) => {
          if (type === 'browser_process_failure') done()
        }
      })
    })

    describe('function(kill)', () => {
      let browser
      beforeEach((done) => {
        client.createWorker = sinon.stub().callsFake((settings, callback) => callback(null, {
          id: 'chrome',
          on: sinon.stub().callsFake((type, callback) => callback('running')),
          browser_url: 'https://google.com'
        }))

        browser = new BrowserStackBrowser('example', emitter, {
          browser: 'chrome',
          browser_version: '73',
          os: 'Windows',
          os_version: '10'
        }, logManager, {}, tunnel, client, decorators.baseLauncher, decorators.captureTimeoutLauncher, decorators.retryLauncher, {})

        browser.start('https://google.com')

        setTimeout(() => done())
      })

      it('should kill the instance', () => {
        browser._done = sinon.stub()

        return browser.kill(browser._done).then(() => {
          expect(browser._done.callCount).to.equal(2)
        })
      })

      it('should ignore multiple requests', () => {
        browser._done = sinon.stub()

        const promise = browser.kill(browser._done)
        const otherPromise = browser.kill(browser._done)

        return Promise.all([promise, otherPromise]).then(() => {
          expect(client.terminateWorker.callCount).to.equal(1)
          expect(browser._done.callCount).to.equal(4)
        })
      })

      it('should fall through if worker id is not set', () => {
        const browser = new BrowserStackBrowser('example', emitter, {
          browser: 'chrome',
          browser_version: '73',
          os: 'Windows',
          os_version: '10'
        }, logManager, {}, tunnel, client, decorators.baseLauncher, decorators.captureTimeoutLauncher, decorators.retryLauncher, {})

        browser._done = sinon.stub()

        return browser.kill(browser._done)
      })
    })

    describe('function(forceKill)', () => {
      it('should execute kill', () => {
        const browser = new BrowserStackBrowser('example', emitter, {
          browser: 'chrome',
          browser_version: '73',
          os: 'Windows',
          os_version: '10'
        }, logManager, {}, tunnel, client, decorators.baseLauncher, decorators.captureTimeoutLauncher, decorators.retryLauncher, {})

        sinon.stub(browser, 'kill')

        browser.forceKill()

        expect(browser.kill.callCount).to.equal(1)
      })
    })

    describe('function(markCaptured)', () => {
      it('should mark the browser as captured', () => {
        const browser = new BrowserStackBrowser('example', emitter, {
          browser: 'chrome',
          browser_version: '73',
          os: 'Windows',
          os_version: '10'
        }, logManager, {}, tunnel, client, decorators.baseLauncher, decorators.captureTimeoutLauncher, decorators.retryLauncher, {})

        expect(browser.isCaptured()).to.equal(false)

        browser.markCaptured()

        expect(browser.isCaptured()).to.equal(true)
      })

      it('should clear previous timeouts upon capture', (done) => {
        const browser = new BrowserStackBrowser('example', emitter, {
          browser: 'chrome',
          browser_version: '73',
          os: 'Windows',
          os_version: '10'
        }, logManager, {
          captureTimeout: 10000
        }, tunnel, client, decorators.baseLauncher, decorators.captureTimeoutLauncher, decorators.retryLauncher, {})

        client.createWorker = sinon.stub().callsFake((settings, callback) => callback(null, {
          id: 'chrome',
          on: sinon.stub().callsFake((type, callback) => callback('running')),
          browser_url: 'https://google.com'
        }))

        browser.start('https://google.com')

        setTimeout(() => {
          expect(browser.isCaptured()).to.equal(false)

          browser.markCaptured()

          expect(browser.isCaptured()).to.equal(true)

          done()
        })
      })
    })

    describe('function(isCaptured)', () => {
      it('should return true if have captured the browser', () => {
        const browser = new BrowserStackBrowser('example', emitter, {
          browser: 'chrome',
          browser_version: '73',
          os: 'Windows',
          os_version: '10'
        }, logManager, {}, tunnel, client, decorators.baseLauncher, decorators.captureTimeoutLauncher, decorators.retryLauncher, {})

        browser.markCaptured()
        expect(browser.isCaptured()).to.equal(true)
      })

      it('should return false if we have not captured the browser', () => {
        const browser = new BrowserStackBrowser('example', emitter, {
          browser: 'chrome',
          browser_version: '73',
          os: 'Windows',
          os_version: '10'
        }, logManager, {}, tunnel, client, decorators.baseLauncher, decorators.captureTimeoutLauncher, decorators.retryLauncher, {})

        expect(browser.isCaptured()).to.equal(false)
      })
    })

    describe('function(toString)', () => {
      it('should ...', () => {
        const browser = new BrowserStackBrowser('example', emitter, {
          browser: 'chrome',
          browser_version: '73',
          os: 'Windows',
          os_version: '10'
        }, logManager, {}, tunnel, client, decorators.baseLauncher, decorators.captureTimeoutLauncher, decorators.retryLauncher, {})

        expect(browser.toString()).to.equal('chrome 73 (Windows 10) on BrowserStack')
      })
    })

    describe('function(_onTimeout)', () => {
      it('should ...', () => {

      })
    })
  })
})
