# karma-browserstack-launcher

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/karma-runner/karma-browserstack-launcher)
 [![npm version](https://img.shields.io/npm/v/karma-browserstack-launcher.svg?style=flat-square)](https://www.npmjs.com/package/karma-browserstack-launcher) [![npm downloads](https://img.shields.io/npm/dm/karma-browserstack-launcher.svg?style=flat-square)](https://www.npmjs.com/package/karma-browserstack-launcher)

[![Build Status](https://img.shields.io/travis/karma-runner/karma-browserstack-launcher/master.svg?style=flat-square)](https://travis-ci.org/karma-runner/karma-browserstack-launcher) [![Dependency Status](https://img.shields.io/david/karma-runner/karma-browserstack-launcher.svg?style=flat-square)](https://david-dm.org/karma-runner/karma-browserstack-launcher) [![devDependency Status](https://img.shields.io/david/dev/karma-runner/karma-browserstack-launcher.svg?style=flat-square)](https://david-dm.org/karma-runner/karma-browserstack-launcher#info=devDependencies)

> Use any browser on [BrowserStack](https://www.browserstack.com/)!


## Installation

The easiest way is to keep `karma-browserstack-launcher` as a devDependency in your `package.json`. Just run,

```bash
$ npm install karma-browserstack-launcher --save-dev
```

and it will be added automatically.


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

    // define browsers
    customLaunchers: {
      bs_firefox_mac: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: '21.0',
        os: 'OS X',
        os_version: 'Mountain Lion'
      },
      bs_iphone5: {
        base: 'BrowserStack',
        device: 'iPhone 5',
        os: 'ios',
        os_version: '6.0'
      }
    },

    browsers: ['bs_firefox_mac', 'bs_iphone5']
  })
}
```

### Global options

- `username` your BS username, you can also use `BROWSER_STACK_USERNAME` env variable.
- `accessKey` your BS access key, you can also use `BROWSER_STACK_ACCESS_KEY` env variable.
- `startTunnel` do you wanna establish the BrowserStack tunnel ? (defaults to `true`)
- `tunnelIdentifier` in case you want to start the BrowserStack tunnel outside `karma` by setting `startTunnel` to `false`, set the identifier passed to the `-localIdentifier` option here (optional)
- `retryLimit` how many times do you want to retry to capture the browser ? (defaults to `3`)
- `captureTimeout` the browser capture timeout (defaults to `120`)
- `timeout` the BS worker timeout (defaults to `300`
- `build` the BS worker build name (optional)
- `name` the BS worker name (optional)
- `project` the BS worker project name (optional)
- `binaryBasePath` the BS binary base bath, you can also use `BROWSER_STACK_BINARY_BASE_PATH` env variable. This will override the default and set the base path to the BS local binary (optional)
- `proxyHost` the host of your proxy for communicating with BrowserStack REST API and BrowserStackLocal (optional)
- `proxyPort` the port of your proxy (optional)
- `proxyUser` the username used for authentication with your proxy (optional)
- `proxyPass` the password used for authentication with your proxy (optional)
- `proxyProtocol` the protocol of your proxy (optional. default: `http`. valid: `http` or `https`)
- `forcelocal` force traffic through the local BrowserStack tunnel, passes flag through to BrowserStackTunnel

### Per browser options

- `device` name of the device
- `real_mobile ` allow browserstack to use a simulator
- `browser` name of the browser
- `browser_version` version of the browser
- `os` which platform ?
- `os_version` version of the platform
- `build` the BS worker build name (optional, defaults to global)
- `name` the BS worker name (optional, defaults to global)
- `project` the BS worker project name (optional, defaults to global)

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

### Browserstack iOS simulators

By default, your Selenium and JS tests will run on real iOS devices on BrowserStack. Since we are in the implementation phase, we are still working on a few things, such as adding more devices, ability to test on local URLs, etc.

In case your tests are facing any issues on real iOS devices, we also provide iOS simulators where you can run your automated tests smoothly.

To access our iOS simulators, use the following capabilities:

```js
customLaunchers: {
  iPad_3: {
    real_mobile: false,
    device: 'iPad 3rd (6.0)',
    os: 'ios',
    'os_version': '6.0',
    'browser_version': null,
    browser: 'Mobile Safari'
  }
}
```

List of iOS simulators you can test on:

- `device: 'iPad 3rd', 'os_version': '5.1'`
- `device: 'iPad 3rd (6.0)', 'os_version': '6.0'`
- `device: 'iPad Mini', 'os_version': '7.0'`
- `device: 'iPad 4th', 'os_version': '7.0'`
- `device: 'iPhone 4S', 'os_version': '5.1'`
- `device: 'iPhone 4S (6.0)', 'os_version': '6.0'`
- `device: 'iPhone 5', 'os_version': '6.0'`
- `device: 'iPhone 5S', 'os_version': '7.0'`

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

Check out sample code working with karma-browserstack-launcher [here](https://github.com/browserstack/karma-browserstack-example).
