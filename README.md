# karma-browserstack-launcher

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/karma-runner/karma-browserstack-launcher)
 [![npm version](https://img.shields.io/npm/v/karma-browserstack-launcher.svg?style=flat-square)](https://www.npmjs.com/package/karma-browserstack-launcher) [![npm downloads](https://img.shields.io/npm/dm/karma-browserstack-launcher.svg?style=flat-square)](https://www.npmjs.com/package/karma-browserstack-launcher)

[![Build Status](https://img.shields.io/travis/karma-runner/karma-browserstack-launcher/master.svg?style=flat-square)](https://travis-ci.org/karma-runner/karma-browserstack-launcher) [![Dependency Status](https://img.shields.io/david/karma-runner/karma-browserstack-launcher.svg?style=flat-square)](https://david-dm.org/karma-runner/karma-browserstack-launcher) [![devDependency Status](https://img.shields.io/david/dev/karma-runner/karma-browserstack-launcher.svg?style=flat-square)](https://david-dm.org/karma-runner/karma-browserstack-launcher#info=devDependencies)

> Use any browser on [BrowserStack](https://www.browserstack.com/)!


## Installation

The easiest way is to keep `karma-browserstack-launcher` as a devDependency in your `package.json`.
Currently this branch 'reporting_enhancements' is not merged into master and is not available on npm.
To install this version ensure you have your Karma project and this version of the Karma Browserstack launcher (https://github.com/samirans89/karma-browserstack-launcher/tree/reporting_enhancements) cloned under the same parent directory.
Post that just run,

```bash
$ npm install ../karma-browserstack-launcher
```


## Configuration

```js
// karma.conf.js
module.exports = function(config) {
  config.set({
    // global config of your BrowserStack account
    browserStack: {
      username: 'jamesbond',
      accessKey: '007'
    },

    // define BrowserStack browsers
    customLaunchers: {
      bs_firefox_mac: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: '70.0',
        os: 'OS X',
        os_version: 'High Sierra',
        forcelocal: true
      },
      bs_pixel: {
        base: 'BrowserStack',
        device: 'Google Pixel',
        real_mobile: true,
        os: 'Android',
        os_version: '8.0'
      },
      bs_iphone8: {
        base: 'BrowserStack',
        device: 'iPhone 8',
        real_mobile: true,
        os: 'iOS',
        os_version: '11.0'
      },
      bs_chrome_win10: {
        base: 'BrowserStack',
        browser: 'chrome',
        browser_version: '79',
        os: 'Windows',
        os_version: '10'
      },
      bs_ie_win81: {
        base: 'BrowserStack',
        browser: 'IE',
        browser_version: '11',
        os: 'Windows',
        os_version: '8.1'
      }
    },
    browsers: ['bs_firefox_mac', 'bs_pixel', 'bs_iphone8', 'bs_chrome_win10', 'bs_ie_win81'],
  })
}
```

### Global options

- `username` your BS username, you can also use `BROWSERSTACK_USERNAME` env variable.
- `accessKey` your BS access key, you can also use `BROWSERSTACK_ACCESS_KEY` env variable.
- `startTunnel` do you wanna establish the BrowserStack tunnel ? (defaults to `true`)
- `tunnelIdentifier` in case you want to start the BrowserStack tunnel outside `karma` by setting `startTunnel` to `false`, set the identifier passed to the `-localIdentifier` option here (optional)
- `retryLimit` how many times do you want to retry to capture the browser ? (defaults to `3`)
- `captureTimeout` the browser capture timeout (defaults to `120`)
- `timeout` the BS worker timeout (defaults to `300`
- `build` the BS worker build name (optional)
- `name` the BS worker name (optional)
- `project` the BS worker project name (optional)
- `proxyHost` the host of your proxy for communicating with BrowserStack REST API and BrowserStackLocal (optional)
- `proxyPort` the port of your proxy (optional)
- `proxyUser` the username used for authentication with your proxy (optional)
- `proxyPass` the password used for authentication with your proxy (optional)
- `proxyProtocol` the protocol of your proxy (optional. default: `http`. valid: `http` or `https`)
- `forcelocal` force traffic through the local BrowserStack tunnel, passes flag through to BrowserStackTunnel
- `video` enable video recording of session on BrowserStack (defaults to `true`)

### Per browser options

- `device` name of the device
- `real_mobile` or `realMobile` is required to run on a real mobile device
- `browser` name of the browser
- `browser_version` version of the browser
- `os` which platform ?
- `os_version` version of the platform
- `build` the BS worker build name (optional, defaults to global)
- `name` the BS worker name (optional, defaults to global)
- `project` the BS worker project name (optional, defaults to global)

> **Note:** you can also pass through any additional options supported by browserstack. (EG. `url`, `resolution`, etc.)  
See https://www.browserstack.com/automate/capabilities for a full list of supported options.

### BrowserStack reporter

To report session results back to BrowserStack for display on your BrowserStack dashboard, use the following additional configuration:

```js
// karma.conf.js
module.exports = function(config) {
  config.set({
    // The rest of your karma config is here
    // ...
    reporters: ['dots', 'BrowserStack']
  })
}
```

### CI/CD Build Environment Variables

Many CI/CD systems will make the name or ID of the currently running build available via an environment variable. The follow environment variables below are supported by default:

* `process.env.BUILD_NUMBER`
* `process.env.BUILD_TAG`
* `process.env.CI_BUILD_NUMBER`
* `process.env.CI_BUILD_TAG`
* `process.env.TRAVIS_BUILD_NUMBER`
* `process.env.CIRCLE_BUILD_NUM`
* `process.env.DRONE_BUILD_NUMBER`

---

[BrowserStack's REST API documentation](https://www.browserstack.com/automate/rest-api#rest-api-browsers)
explains how to retrieve a list of desired capabilities for browsers.

----

For more information on Karma see the [homepage](http://karma-runner.github.io).

----

Check out sample code working with karma-browserstack-launcher [here](https://github.com/samirans89/karma-browserstack-launcher/tree/reporting_enhancements).
