var q = require('q');
var api = require('browserstack');
var BrowserStackTunnel = require('browserstacktunnel-wrapper');


var createBrowserStackTunnel = function(logger, config, emitter) {
  var log = logger.create('launcher.browserstack');
  var bsConfig = config.browserStack || {};

  if (bsConfig.startTunnel === false) {
    return q();
  }

  log.debug('Establishing the tunnel on %s:%s', config.hostname, config.port);

  var deferred = q.defer();
  var tunnel = new BrowserStackTunnel({
    key: process.env.BROWSER_STACK_ACCESS_KEY || bsConfig.accessKey,
    hosts: [{
      name: config.hostname,
      port: config.port,
      sslFlag: 0
    }]
  });

  tunnel.start(function(error) {
    if (error) {
      log.error('Can not establish the tunnel.');
      deferred.reject(error);
    } else {
      log.debug('Tunnel established.')
      deferred.resolve();
    }
  });

  emitter.on('exit', function(done) {
    log.debug('Shutting down the tunnel.');
    tunnel.stop(function(error) {
      done();
    });
  });

  return deferred.promise;
};



var createBrowserStackClient = function(/* config.browserStack */ config) {
  var env = process.env;

  // TODO(vojta): handle no username/pwd
  return api.createClient({
    username: env.BROWSER_STACK_USERNAME || config.username,
    password: env.BROWSER_STACK_ACCESS_KEY || config.accessKey
  });
};

var formatError = function(error) {
  if (error.message === 'Validation Failed') {
    return '  Validation Failed: you probably misconfigured the browser ' +
      'or given browser is not available.';
  }

  return error.toString();
};


var BrowserStackBrowser = function(id, emitter, args, logger,
                                   /* config */ config,
                                   /* browserStackTunnel */ tunnel, /* browserStackClient */ client) {

  var self = this;
  var workerId = null;
  var captured = false;
  var log = logger.create('launcher.browserstack');
  var browserName = (args.browser || args.device) + (args.browser_version ? ' ' + args.browser_version : '') +
    ' (' + args.os + ' ' + args.os_version +  ')' + ' on BrowserStack';

  this.id = id;
  this.name = browserName;

  var bsConfig = config.browserStack;

  var captureTimeout = 0;

  if (config.captureTimeout) {
    captureTimeout = config.captureTimeout;
  }

  var retryLimit = 3;
  if (bsConfig) {
    if (bsConfig.retryLimit) {
      retryLimit = bsConfig.retryLimit;
    }
  }

  this.start = function(url) {

    // TODO(vojta): handle non os/browser/version
    var settings = {
      os: args.os,
      os_version: args.os_version,
      device: args.device,
      browser: args.browser,
      // TODO(vojta): remove "version" (only for B-C)
      browser_version: args.browser_version || args.version || 'latest',
      url: url + '?id=' + id
    };

    if (bsConfig) {
      settings['browserstack.tunnel'] = true;
      if (bsConfig.startTunnel === false) {
        settings['browserstack.tunnel'] = false;
      }
      if (bsConfig.timeout) {
        settings.timeout = bsConfig.timeout;
      }
      if (bsConfig.name) {
        settings.name = bsConfig.name;
      }
      if (bsConfig.build) {
        settings.build = bsConfig.build;
      }
      if (bsConfig.project) {
        settings.project = bsConfig.project;
      }
    }

    this.url = url;
    tunnel.then(function() {
      client.createWorker(settings, function(error, worker) {

        if (error) {
          log.error('Can not start %s\n  %s', browserName, formatError(error));
          return emitter.emit('browser_process_failure', self);
        }

        workerId = worker.id;

        var whenRunning = function() {
          log.debug('%s job started with id %s', browserName, workerId);

          if (captureTimeout) {
            setTimeout(self._onTimeout, captureTimeout);
          }
        };

        var waitForWorkerRunning = function() {
          client.getWorker(workerId, function(error, w) {
            if (error) {
              log.error('Can not get worker %s status %s\n  %s', workerId, browserName, formatError(error));
              return emitter.emit('browser_process_failure', self);
            }
            if (w.status === 'running') {
              whenRunning();
            } else {
              log.debug('%s job with id %s still in queue.', browserName, workerId);
              setTimeout(waitForWorkerRunning, 1000);
            }
          });
        };

        if (worker.status === 'running') {
          whenRunning();
        } else {
          log.debug('%s job queued with id %s.', browserName, workerId);
          setTimeout(waitForWorkerRunning, 1000);
        }

      });
    }, function() {
      emitter.emit('browser_process_failure', self);
    });
  };

  this.kill = function(done) {
    if (!workerId) {
      done();
    }

    log.debug('Killing worker %s', workerId);
    client.terminateWorker(workerId, done);
  };


  this.markCaptured = function() {
    captured = true;
  };

  this.isCaptured = function() {
    return captured;
  };

  this.toString = function() {
    return this.name;
  };

  this._onTimeout = function() {
    if (captured) {
      return;
    }
    captured = false;
    log.warn('%s have not captured in %d ms, killing.', browserName, captureTimeout);
    self.kill(function() {
      if(retryLimit--) {
        self.start(self.url);
      }
    });
  };
};


// PUBLISH DI MODULE
module.exports = {
  'browserStackTunnel': ['factory', createBrowserStackTunnel],
  'browserStackClient': ['factory', createBrowserStackClient],
  'launcher:BrowserStack': ['type', BrowserStackBrowser]
};