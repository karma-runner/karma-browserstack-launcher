var Browserstack = require('browserstack')
var common = require("./common")


var BrowserStackReporter = function(logger, /* BrowserStack:sessionMapping */ sessionMapping, config) {
  try {

    log = logger.create('reporter.browserstack')
    var suiteResults = []
    var buildId
    var callWhenFinished = function() {}

    var exitIfAllFinished = function() {
      callWhenFinished()
    }

    this.onRunStart = function(browsers) {
      // implement this function if you want to perform custom actions post the overall test batch run has started

    };

    this.onBrowserStart = function(browser) {
      // implement this function if you want to perform custom actions post browser start
      log.debug("Browser: " + browser.name + " has been started");
    };

    this.onBrowserError = function(browser, error) {
      var browserId = browser.launchId || browser.id
      if (browserId in sessionMapping) {
        existingObj = suiteResults.find(o => o.browserId === browserId);
        if (typeof existingObj === 'undefined') {
          suiteResults.push({
            browserId: browserId,
            records: [{
              apiStatus: 'Error',
              suite: 'N/A [Karma <-> Browser error]',
              log: error
            }]
          })
        } else {
          existingObj.records.push({
            apiStatus: 'Error',
            suite: 'N/A [Karma <-> Browser error]',
            log: error
          })
        }
      }
    };

    this.specSuccess = function(browser, result) {
      try {
        var browserId = browser.launchId || browser.id
        if (browserId in sessionMapping) {
          existingObj = suiteResults.find(o => o.browserId === browserId);
          if (typeof existingObj === 'undefined') {
            suiteResults.push({
              browserId: browserId,
              records: [{
                apiStatus: 'Passed',
                suite: result.suite,
                specs: [result.description]
              }]
            })
          } else {
            existingObj['records'][0]['specs'].push(result.description)
          }
        }
      } catch (e) {
        log.debug('Browserstack reporter module specSuccess function encountered issues.\nError message: ' + e.message + '\nStacktrace: ' + e.stack)
      }
    };

    this.specFailure = this.specSkipped = function(browser, result) {
      try {
        var browserId = browser.launchId || browser.id
        log.debug('Spec Failure:' + JSON.stringify(result))
        if (browserId in sessionMapping) {
          existingObj = suiteResults.find(o => o.browserId === browserId);
          if (typeof existingObj === 'undefined') {
            suiteResults.push({
              browserId: browserId,
              records: [{
                apiStatus: 'Failed',
                suite: result.suite,
                log: result.log
              }]
            })
          } else {
            existingObj.records.push({
              apiStatus: 'Failed',
              suite: result.suite,
              log: result.log
            })
          }
        }
      } catch (e) {
        log.debug('Browserstack reporter module specFailure function encountered issues.\nError message: ' + e.message + '\nStacktrace: ' + e.stack)
      }
    };

    this.onSpecComplete = function(browser, result) {
      var browserId = browser.launchId || browser.id
      if (result.skipped) {
        this.specSkipped(browser, result);
      } else if (result.success) {
        this.specSuccess(browser, result);
      } else {
        this.specFailure(browser, result);
      }
      log.debug('Suite: ' + result.suite + ', Spec completed: ' + result.description);
    }

    this.onRunComplete = function(browsersCollection, results) {
      // implement this function if you want to perform custom actions post test run completion
      try {
        log.debug("Test run completed\n" + JSON.stringify(results))
        var browserId = browsersCollection.browsers[0].id

        if (typeof buildId === 'undefined') {
          var browserstackClient = Browserstack.createAutomateClient(sessionMapping.credentials)
          common.getSessionDetails(log, browserstackClient, sessionMapping, browserId, config, function(sessionObj) {
            browserUrl = sessionObj['automation_session']['browser_url']
            if (typeof browserUrl !== 'undefined') {
              buildId = browserUrl.split('/').slice(-3)[0]
              var originalBuildName = config.browserStack.build
              if (typeof buildId !== undefined || buildId != undefined) {
                var originalBuildName = config.browserStack.build
                common.updateBuildName(buildId, originalBuildName, results, config)
              }
            }
          })
        }
      } catch (e) {
        log.debug('onRunComplete: Browserstack reporter module encountered issues.\nError message: ' + e.message + '\nStacktrace: ' + e.stack)
      }
    };

    var findSpecObjectRecords = function(browserId, specStatusSearchCondition) {
      var suiteObj = suiteResults.find(o => o.browserId === browserId)
      var specRecord = undefined
      if (typeof suiteObj !== 'undefined') {
        if (specStatusSearchCondition !== '') {
          specRecord = suiteObj.records.find(o => o.apiStatus === specStatusSearchCondition)
        }
      }
      return [suiteObj, specRecord]
    }

    var removeFromSuiteResults = function(objectListToRemove) {
      suiteResults = suiteResults.filter(function(item) {
        return item !== objectListToRemove
      })
    }

    this.onBrowserComplete = function(browser) {
      try {
        var browserId = browser.launchId || browser.id
        var failedObjRecord = findSpecObjectRecords(browserId, 'Failed')
        var errorObjRecord = findSpecObjectRecords(browserId, 'Error')
        var browserstackClient = Browserstack.createAutomateClient(sessionMapping.credentials)
        if (browserId in sessionMapping) {
          if (typeof failedObjRecord[1] !== 'undefined') {
            var reason = 'Suite: ' + failedObjRecord[1]['suite'] + ', Error log: ' + failedObjRecord[1]['log']
            common.updateStatusSession(log, browserstackClient, sessionMapping, browserId, failedObjRecord[1].apiStatus, reason, failedObjRecord[1]['suite'])
            removeFromSuiteResults(failedObjRecord[0])
          } else if (typeof errorObjRecord[1] === 'undefined') {
            var passedObjRecord = findSpecObjectRecords(browserId, 'Passed')
            if (typeof passedObjRecord[1] !== 'undefined') {
              var reason = 'Suite: ' + passedObjRecord[1]['suite'] + ', Specs run: ' + JSON.stringify(passedObjRecord[1]['specs'])
              common.updateStatusSession(log, browserstackClient, sessionMapping, browserId, passedObjRecord[1].apiStatus, reason, passedObjRecord[1]['suite'])
              removeFromSuiteResults(passedObjRecord[0])
            }
          }
        }
        result = browser.lastResult
        log.debug("Browser's Last Result: " + JSON.stringify(result, null, 2))
        if (result.disconnected) {
          log.error('✖ Test Disconnected')
        } else if (result.error) {
          log.error('✖ Test Errored')
        }
        var errorObjRecord = findSpecObjectRecords(browserId, 'Error')
        if (typeof errorObjRecord[1] !== 'undefined') {
          var reason = 'Suite: ' + errorObjRecord[1]['suite'] + ', Error log: ' + errorObjRecord[1]['log']
          common.updateStatusSession(log, browserstackClient, sessionMapping, browserId, errorObjRecord[1].apiStatus, reason, errorObjRecord[1]['suite'])
          removeFromSuiteResults(errorObjRecord[0])
        }
      } catch (e) {
        log.debug('Browserstack reporter module encountered issues.\nError message: ' + e.message + '\nStacktrace: ' + e.stack)
      }
    }

    // Wait until all updates have been pushed to Browserstack
    this.onExit = function(done) {
      callWhenFinished = done
      exitIfAllFinished()
    }

  } catch (e) {
    log.debug('Browserstack reporter full module encountered issues.\nError message: ' + e.message + '\nStacktrace: ' + e.stack)

  }
}
// PUBLISH DI MODULE
module.exports = BrowserStackReporter
