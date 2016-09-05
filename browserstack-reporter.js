var Browserstack = require('browserstack')

var BrowserStackReporter = function (logger, /* BrowserStack:sessionMapping */ sessionMapping) {
  var log = logger.create('reporter.browserlabs')

  var pendingUpdates = 0
  var callWhenFinished = function () {}

  var exitIfAllFinished = function () {
    if (pendingUpdates === 0) {
      callWhenFinished()
    }
  }

  // We're only interested in the final results per browser
  this.onBrowserComplete = function (browser) {
    var result = browser.lastResult

    if (result.disconnected) {
      log.error('✖ Test Disconnected')
    }

    if (result.error) {
      log.error('✖ Test Errored')
    }

    var browserId = browser.launchId || browser.id
    if (browserId in sessionMapping) {
      pendingUpdates++
      var browserstackClient = Browserstack.createAutomateClient(sessionMapping.credentials)
      var apiStatus = !(result.failed || result.error || result.disconnected) ? 'completed' : 'error'

      browserstackClient.updateSession(sessionMapping[browserId], {
        status: apiStatus
      }, function (error) {
        if (error) {
          log.error('✖ Could not update BrowserStack status')
          log.debug(error)
        }
        pendingUpdates--
        exitIfAllFinished()
      })
    }
  }

  // Wait until all updates have been pushed to Browserstack
  this.onExit = function (done) {
    callWhenFinished = done
    exitIfAllFinished()
  }
}

module.exports = BrowserStackReporter
