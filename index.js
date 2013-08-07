var api = require('browserstack');

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


var BrowserStackBrowser = function(id, emitter, /* browserStackClient */ client, args, logger) {
  var self = this;
  var workerId = null;
  var captured = false;
  var log = logger.create('launcher.browserstack');
  var browserName = args.browser + (args.version ? ' ' + args.version : '') +
                    (args.os ? ' (' + args.os + ')' : '') + ' on BrowserStack';

  this.id = id;
  this.name = browserName;

  this.start = function(url) {
    // TODO(vojta): handle non os/browser/version
    var settings = {
      os: args.os,
      browser: args.browser,
      version: args.version || 'latest',
      url: url + '?id=' + id
    };

    client.createWorker(settings, function(error, worker) {
      if (error) {
        log.error('Can not start %s\n  %s', browserName, formatError(error));
        return emitter.emit('browser_process_failure', self);
      }

      log.debug('Browser %s started with id %s', browserName, worker.id);
      workerId = worker.id;
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
};


// PUBLISH DI MODULE
module.exports = {
  'browserStackClient': ['factory', createBrowserStackClient],
  'launcher:BrowserStack': ['type', BrowserStackBrowser]
};
