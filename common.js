var RestClient = require('node-rest-client').Client

module.exports = {
  updateStatusSession: function (log, browserstackClient, sessionMapping, browserId, status, reason, sessionName) {
    browserstackClient.updateSession(sessionMapping[browserId], {
      status: status,
      reason: reason,
      name: sessionName.length !== 0 ? sessionName.toString() : 'Karma Test Suite'
    }, function (error) {
      if (error) {
        log.error('✖ Could not update BrowserStack status' + error)
      }
    })
  },
  getSessionDetails: function (log, browserstackClient, sessionMapping, browserId, config, callback) {
    try {
      var apiClientEndpoint = config.browserStack.apiClientEndpoint
      var creds = sessionMapping.credentials.username + ':' + sessionMapping.credentials.password

      let buff = new Buffer(creds);
      let base64data = buff.toString('base64');
      var encodedCreds = base64data // base64js.fromByteArray(arr)
      var client = new RestClient()
      var args = {
        data: {},
        headers: {
          'Authorization': 'Basic ' + encodedCreds
        }
      }
      client.get(apiClientEndpoint + '/automate/sessions/' + sessionMapping[browserId] + '.json', args, function (data, response) {
        callback(data)
      })
    } catch (e) {
      log.debug('Browserstack reporter module encountered issues.\nError message: ' + e.message + '\nStacktrace: ' + e.stack)
    }
  },
  updateBuildName: function (log, buildId, originalBuildName, results, config) {
    try {
      log.debug('Attempting build name update')
      if (typeof buildId === 'undefined') {
        log.debug('BrowserStack build id is not defined. Not attempting update for build id!')
        return
      }

      var apiClientEndpoint = config.browserStack.apiClientEndpoint
      var client = new RestClient()
      var newBuildName
      var t = new Date().toISOString()

      if (originalBuildName === null || typeof originalBuildName === 'undefined') {
        originalBuildName = 'Karma build'
      }

      if (typeof results !== 'undefined') {
        if (results.exitCode === 1) {
          if (results.disconnected === true) {
            newBuildName = originalBuildName + ' completed at ' + t + ' with 1 or more session disconnects: [Specs passed: ' + results.success + ' | Specs failed: ' + results.failed + ']'
          } else if (results.error === true) {
            newBuildName = originalBuildName + ' completed at ' + t + ' with 1 or more session errors: [Specs passed: ' + results.success + ' | Specs failed: ' + results.failed + ']'
          } else if (results.failed !== 0) {
            newBuildName = originalBuildName + ' completed at ' + t + ' with spec failures: [Specs passed: ' + results.success + ' | Specs failed: ' + results.failed + ']'
          }
        } else if (results.failed === 0) {
          newBuildName = originalBuildName + ' completed successfully at ' + t + ': [Specs passed: ' + results.success + ']'
        }
      } else {
        newBuildName = originalBuildName + ' started at ' + t + ' | In Progress | '
      }
      var creds = config.browserStack.username + ':' + config.browserStack.accessKey

      let buff = new Buffer(creds);
      let base64data = buff.toString('base64');
      var encodedCreds = base64data
      // var encodedCreds = base64js.fromByteArray(arr)
      var args = {
        data: {
          name: newBuildName
        },
        headers: {
          'Authorization': 'Basic ' + encodedCreds,
          'Content-Type': 'application/json'
        }
      }
      var completeEndpoint = apiClientEndpoint + '/automate/builds/' + buildId + '.json'
      log.debug('Complete endpoint for build name update: ' + completeEndpoint)
      client.put(completeEndpoint, args, function (data, response) {
      })
      log.debug('Exiting updateBuildName function')
    } catch (e) {
      log.debug('Browserstack reporter module update build name function encountered issues.\nError message: ' + e.message + '\nStacktrace: ' + e.stack)
    }
  }
}
