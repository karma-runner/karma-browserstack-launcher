# karma-browserstack-launcher

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/karma-runner/karma-browserstack-launcher)
 [![npm version](https://img.shields.io/npm/v/karma-browserstack-launcher.svg?style=flat-square)](https://www.npmjs.com/package/karma-browserstack-launcher) [![npm downloads](https://img.shields.io/npm/dm/karma-browserstack-launcher.svg?style=flat-square)](https://www.npmjs.com/package/karma-browserstack-launcher)

[![Build Status](https://img.shields.io/travis/karma-runner/karma-browserstack-launcher/master.svg?style=flat-square)](https://travis-ci.org/karma-runner/karma-browserstack-launcher) [![Dependency Status](https://img.shields.io/david/karma-runner/karma-browserstack-launcher.svg?style=flat-square)](https://david-dm.org/karma-runner/karma-browserstack-launcher) [![devDependency Status](https://img.shields.io/david/dev/karma-runner/karma-browserstack-launcher.svg?style=flat-square)](https://david-dm.org/karma-runner/karma-browserstack-launcher#info=devDependencies)

> Use any browser on [BrowserStack](https://www.browserstack.com/)!

## Installation

Install `karma-browserstack-launcher` as a `devDependency` in your package.json:

```sh
$ npm install karma-browserstack-launcher --save-dev
```

## Configuration

```js
// karma.conf.js
module.exports = function(config) {
  const customLaunchers = {
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
  };
  
  config.set({
    // global config of your BrowserStack account
    browserStack: {
      username: 'jamesbond',
      accessKey: '007'
    },

    // define browsers
    customLaunchers: customLaunchers,
    browsers: Object.keys(customLaunchers)
  })
}
```

**Note: this config assumes that `process.env.BROWSERSTACK_USERNAME` and `process.env.BROWSERSTACK_ACCESS_KEY` are set.**

### `browserStack` Config Properties

#### `username`

Type: `string` Default: `process.env.BROWSERSTACK_USERNAME`

Your BrowserStack username (if you don't have an account you can sign up [here](https://www.browserstack.com/users/sign_up)).

#### `accessKey`

Type: `string` Default: `process.env.BROWSERSTACK_ACCESS_KEY`

Your BrowserStack access key.

#### `startTunnel`

Type: `boolean` Default: `true`

If `true`, the BrowserStack tunnel will be started automatically.

#### `tunnelIdentifier` (optional)

Type: `string`

In case you want to start the BrowserStack tunnel outside of `karma` by setting `startTunnel` to `false`, set the identifier passed to `-localIdentifier` option here

#### `retryLimit`

Type: `number` Default: `3`

The number of times to retry browser capture.

#### `captureTimeout`

Type: `number` Default: `120`

The timeout for capturing the browser.

#### `timeout`

Type: `number` Default: `300`

The BrowserStack worker timeout.

#### `build` (optional)

Type: `string`

The BrowserStack worker build name.

#### `name` (optional)

Type: `string`

The BrowserStack worker name.

#### `project` (optional)

Type: `string`

The BrowserStack worker project name.

#### `proxyHost` (optional)

Type: `string`

The host of your proxy for communicating with the BrowserStack REST API and BrowserStackLocal.

#### `proxyPort` (optional)

Type: `number`

The port of your proxy.

#### `proxyUser` (optional)

Type: `string`

The username used for authenticating with your proxy.

#### `proxyPass` (optional)

Type: `string`

The password used for authenticating with your proxy.

#### `proxyProtocol`

Type: `string` Default: `http`

The protocol of your proxy. (`http` or `https`)

#### `video`

Type: `boolean` Default: `true`

Enable video recording of session on BrowserStack.

### Browser Options

#### `device`

The name of the device.

#### `real_mobile` or `realMobile`

Type: `boolean` Default: `false`

Allows the session to run on a real mobile device instead of an emulator / simulator.

#### `browser`

Type: `string`

The name of the browser

#### `browser_version`

Type: `string`

The version of the browser.

#### `os`

Type: `string`

The platform to run on.

#### `os_version`

Type: `string`

The version of the platform.

#### `build` (optional)

Type: `string` Default: `browserStack.build`

The BrowserStack worker build name

#### `name` (optional)

Type: `string` Default: `browserStack.name`

The BrowserStack worker name.

#### `project` (optional)

Type: `string` Default: `browserStack.project`

The BrowserStack worker project name.

> **Note:** you can also pass through any additional options supported by browserstack. (EG. `timezone`, `resolution`, etc.)  
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
