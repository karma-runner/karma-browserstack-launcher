const Q = require('q')
const api = require('browserstack')
const browserstack = require('browserstack-local')
const workerManager = require('./worker-manager')
const BrowserStackReporter = require('./browserstack-reporter')

var createBrowserStackTunnel = function (logger, config, emitter) {
  const log = logger.create('launcher.browserstack')
  const bsConfig = config.browserStack || {}
  if (bsConfig.startTunnel === false) {
    return Q()
  }

  const bsAccesskey = process.env.BROWSERSTACK_ACCESS_KEY || process.env.BROWSER_STACK_ACCESS_KEY || bsConfig.accessKey
  const bsLocal = new browserstack.Local()
  const bsLocalArgs = {
    key: bsAccesskey,
    localIdentifier: bsConfig.localIdentifier || bsConfig.tunnelIdentifier || undefined,
    forceLocal: bsConfig.forceLocal || undefined
  }
  const deferred = Q.defer()

  log.debug('Starting BrowserStackLocal')
  bsLocal.start(bsLocalArgs, function () {
    log.debug('Started BrowserStackLocal')
    deferred.resolve()
  })

  emitter.on('exit', function (done) {
    log.debug('Shutting down BrowserStackLocal')
    bsLocal.stop(function () {
      log.debug('Stopped BrowserStackLocal')
      done()
    })
  })

  return deferred.promise
}

var createBrowserStackClient = function (/* config.browserStack */config, /* BrowserStack:sessionMapping */ sessionMapping) {
  var env = process.env

  config = config || {}

  var options = {
    username: env.BROWSERSTACK_USERNAME || env.BROWSER_STACK_USERNAME || config.username,
    password: env.BROWSERSTACK_ACCESS_KEY || env.BROWSER_STACK_ACCESS_KEY || config.accessKey
  }

  if (!options.username) {
    console.error('No browserstack username!')
    console.error(' Set username via env.BROWSERSTACK_USERNAME, env.BROWSER_STACK_USERNAME, or config.username.')
  }

  if (!options.password) {
    console.error('No browserstack password!')
    console.error(' Set username via env.BROWSERSTACK_ACCESS_KEY, env.BROWSER_STACK_ACCESS_KEY, or config.accessKey.')
  }

  if (!options.username || !options.password) {
    process.exit(1)
  }

  if (config.proxyHost && config.proxyPort) {
    config.proxyProtocol = config.proxyProtocol || 'http'
    var proxyAuth = (config.proxyUser && config.proxyPass)
      ? (encodeURIComponent(config.proxyUser) + ':' + encodeURIComponent(config.proxyPass) + '@') : ''
    options.proxy = config.proxyProtocol + '://' + proxyAuth + config.proxyHost + ':' + config.proxyPort
  }

  if (!config.browserstack || config.browserStack.startTunnel !== false) {
    options.Local = true
  }

  sessionMapping.credentials = {
    username: options.username,
    password: options.password,
    proxy: options.proxy
  }

  var client = api.createClient(options)

  var pollingTimeout = config.pollingTimeout || 1000

  if (!workerManager.isPolling) {
    workerManager.startPolling(client, pollingTimeout, function (err) {
      if (err) {
        console.error(err)
      }
    })
  }

  return client
}

var formatError = function (error) {
  if (error.message === 'Validation Failed') {
    return '  Validation Failed: you probably misconfigured the browser ' +
      'or given browser is not available.'
  }

  return error.toString()
}

var BrowserStackBrowser = function (
  id, emitter, args, logger,
  /* config */ config,
  /* browserStackTunnel */ tunnel,
  /* browserStackClient */ client,
  baseLauncherDecorator,
  captureTimeoutLauncherDecorator,
  retryLauncherDecorator,
  /* BrowserStack:sessionMapping */ sessionMapping
) {
  var self = this

  baseLauncherDecorator(self)
  captureTimeoutLauncherDecorator(self)
  retryLauncherDecorator(self)

  var workerId = null
  var captured = false
  var alreadyKilling = null
  var log = logger.create('launcher.browserstack')
  var browserName = (args.browser || args.device) + (args.browser_version ? ' ' + args.browser_version : '') +
    ' (' + args.os + ' ' + args.os_version + ')'

  this.id = id
  this.name = browserName + ' on BrowserStack'

  var bsConfig = config.browserStack || {}
  var captureTimeout = config.captureTimeout || 0
  var captureTimeoutId
  var retryLimit = bsConfig.retryLimit || 3
  var previousUrl = null

  this.start = function (url) {
    url = url || previousUrl
    previousUrl = url

    var globalSettings = Object.assign(
      {
        timeout: 300,
        name: 'Karma test',
        build: process.env.BUILD_NUMBER ||
          process.env.BUILD_TAG ||
          process.env.CI_BUILD_NUMBER ||
          process.env.CI_BUILD_TAG ||
          process.env.TRAVIS_BUILD_NUMBER ||
          process.env.CIRCLE_BUILD_NUM ||
          process.env.DRONE_BUILD_NUMBER || null,
        // TODO(vojta): remove "version" (only for B-C)
        browser_version: args.version || 'latest',
        video: true
      },
      bsConfig
    )

    // TODO(vojta): handle non os/browser/version
    var settings = Object.assign(
      {
        url: url + '?id=' + id,
        'browserstack.tunnel': true
      },
      globalSettings,
      args
    )

    tunnel.then(function () {
      client.createWorker(settings, function (error, worker) {
        var sessionUrlShowed = false

        if (error) {
          log.error('Can not start %s\n  %s', browserName, formatError(error))
          return emitter.emit('browser_process_failure', self)
        }

        workerId = worker.id
        alreadyKilling = null

        worker = workerManager.registerWorker(worker)
        worker.on('status', function (status) {
          // TODO(vojta): show immediately in createClient callback once this gets fixed:
          // https://github.com/browserstack/api/issues/10
          if (!sessionUrlShowed) {
            log.info('%s session at %s', browserName, worker.browser_url)
            sessionMapping[self.id] = worker.browser_url.split('/').slice(-1)[0]
            sessionUrlShowed = true
          }

          switch (status) {
            case 'running':
              log.debug('%s job started with id %s', browserName, workerId)

              if (captureTimeout && !captured) {
                captureTimeoutId = setTimeout(self._onTimeout, captureTimeout)
              }
              break

            case 'queue':
              log.debug('%s job with id %s in queue.', browserName, workerId)
              break

            case 'delete':
              log.debug('%s job with id %s has been deleted.', browserName, workerId)
              break
          }
        })
      })
    }).catch(function () {
      emitter.emit('browser_process_failure', self)
    })
  }

  this.kill = function (done) {
    var allDone = function () {
      self._done()
      if (done) {
        done()
      }
    }

    if (!alreadyKilling) {
      alreadyKilling = Q.defer()

      if (workerId) {
        log.debug('Killing %s (worker %s).', browserName, workerId)
        client.terminateWorker(workerId, function () {
          log.debug('%s (worker %s) successfully killed.', browserName, workerId)

          if (captureTimeoutId) {
            clearTimeout(captureTimeoutId)
            captureTimeoutId = null
          }

          workerId = null
          captured = false
          alreadyKilling.resolve()
        })
      } else {
        alreadyKilling.resolve()
      }
    }

    return alreadyKilling.promise.then(allDone)
  }

  this.forceKill = function () {
    var self = this

    return Q.promise(function (resolve) {
      self.kill(resolve)
    })
  }

  this.markCaptured = function () {
    captured = true

    if (captureTimeoutId) {
      clearTimeout(captureTimeoutId)
      captureTimeoutId = null
    }
  }

  this.isCaptured = function () {
    return captured
  }

  this.toString = function () {
    return this.name
  }

  this._onTimeout = function () {
    if (captured) {
      return
    }

    log.warn('%s has not captured in %d ms, killing.', browserName, captureTimeout)
    self.kill(function () {
      if (retryLimit--) {
        self.start(previousUrl)
      } else {
        emitter.emit('browser_process_failure', self)
      }
    })
  }
}

// PUBLISH DI MODULE
module.exports = {
  'browserStackTunnel': ['factory', createBrowserStackTunnel],
  'browserStackClient': ['factory', createBrowserStackClient],
  'launcher:BrowserStack': ['type', BrowserStackBrowser],
  'reporter:BrowserStack': ['type', BrowserStackReporter],
  'BrowserStack:sessionMapping': ['value', {}]
}
