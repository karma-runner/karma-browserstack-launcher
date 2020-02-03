var RestClient = require('node-rest-client').Client;
var base64js = require('base64-js')

module.exports = {
  updateStatusSession: function(log, browserstackClient, sessionMapping, browserId, status, reason, sessionName) {
    log.debug("Logger: " + log + ", Automate client: " + browserstackClient + ", sessionMapping: " + sessionMapping + ", browserId: " + browserId + ", status: " + status + ", reason: " + reason)
    browserstackClient.updateSession(sessionMapping[browserId], {
      status: status,
      reason: reason,
      name: sessionName.toString()
    }, function(error) {
      if (error) {
        log.error('✖ Could not update BrowserStack status')
        log.debug(error)
      }
    })
  },
  getSessionDetails: function(log, browserstackClient, sessionMapping, browserId, config, callback) {
    try {
      apiClientEndpoint = config.browserStack.apiClientEndpoint
      log.debug("Logger: " + log + ", Automate client: " + browserstackClient + ", sessionMapping id: " + sessionMapping[browserId] + ", browserId: " + browserId)
      var creds = sessionMapping.credentials.username + ":" + sessionMapping.credentials.password
      var arr = [];
      for (var i = 0; i < creds.length; i++) {
        arr.push(creds.charCodeAt(i));
      }
      encodedCreds = base64js.fromByteArray(arr);
      var client = new RestClient();
      var args = {
        data: {},
        headers: {
          "Authorization": "Basic " + encodedCreds
        }
      };
      client.get(apiClientEndpoint + "/automate/sessions/" + sessionMapping[browserId] + ".json", args, function(data, response) {
        log.debug("Session data: " + data);
        callback(data)
      });
    } catch (e) {
      log.debug('Browserstack reporter module encountered issues.\nError message: ' + e.message + '\nStacktrace: ' + e.stack)
    }
  },
  updateBuildName: function(buildId, originalBuildName, results, config) {
    try {
      log.debug("Attempting build name update")
      apiClientEndpoint = config.browserStack.apiClientEndpoint
      var client = new RestClient();
      var newBuildName
      t = new Date().toISOString()
      if (typeof results !== 'undefined') {
        if (results.exitCode === 1) {
          if (results.disconnected === true) {
            newBuildName = originalBuildName + " completed at " + t + " with 1 or more session disconnects: [Specs passed: " + results.success + " | Specs failed: " + results.failed + "]"
          } else if (results.error === true) {
            newBuildName = originalBuildName + " completed at " + t + " with 1 or more session errors: [Specs passed: " + results.success + " | Specs failed: " + results.failed + "]"
          }
        } else if (results.failed !== 0) {
          newBuildName = originalBuildName + " completed at " + t + " with spec failures: [Specs passed: " + results.success + " | Specs failed: " + results.failed + "]"
        } else if (results.failed == 0) {
          newBuildName = originalBuildName + " completed successfully at " + t + ": [Specs passed: " + results.success + "]"
        }
      } else {
        newBuildName = originalBuildName + " started at " + t + " | In Progress | "
      }
      var creds = config.browserStack.username + ":" + config.browserStack.accessKey
      var arr = [];
      for (var i = 0; i < creds.length; i++) {
        arr.push(creds.charCodeAt(i));
      }
      encodedCreds = base64js.fromByteArray(arr);
      var args = {
        data: {
          name: newBuildName
        },
        headers: {
          "Authorization": "Basic " + encodedCreds,
          "Content-Type": "application/json"
        }
      };

      client.put(apiClientEndpoint + "/automate/builds/" + buildId + ".json", args, function(data, response) {
        log.debug("Updated build data: " + JSON.stringify(data));
      });

      log.debug("Exiting updateBuildName function")

    } catch (e) {
      log.debug('Browserstack reporter module update build name function encountered issues.\nError message: ' + e.message + '\nStacktrace: ' + e.stack)
    }
  }
};
