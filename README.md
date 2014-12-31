# karma-browserstack-launcher

> Use any browser on [BrowserStack](http://www.browserstack.com/)!


## Installation

The easiest way is to keep `karma-browserstack-launcher` as a devDependency in your `package.json`.
```json
{
  "devDependencies": {
    "karma": "~0.10",
    "karma-browserstack-launcher": "~0.1"
  }
}
```

You can also add it by this command:
```bash
npm install karma-browserstack-launcher --save-dev
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
  });
};
```

### Global options
- `username` your BS username (email), you can also use `BROWSER_STACK_USERNAME` env variable.
- `accessKey` your BS access key (password), you can also use `BROWSER_STACK_ACCESS_KEY` env variable.
- `startTunnel` do you wanna establish the BrowserStack tunnel ? (defaults to `true`)
- `retryLimit` how many times do you want to retry to capture the browser ? (defaults to `3`)
- `captureTimeout` the browser capture timeout (defaults to `120`)
- `timeout` the BS worker timeout (defaults to `300`
- `build` the BS worker build name (optional)
- `name` the BS worker name (optional)
- `project` the BS worker project name (optional)

### Per browser options
- `device` name of the device
- `browser` name of the browser
- `browser_version` version of the browser
- `os` which platform ?
- `os_version` version of the platform

### Browserstack iOS simulators
BrowserStack provides real iOS devices for Selenium and JS testing. All your tests are by default executed on the real iOS devices. Thus, you would not find the list of iOS simulators in the documentation or the browsers.json file. The list below for the iOS simulators is complete and you should be able to test smoothly on these devices.  
BrowserStack are actively working on improving the performance of real iOS devices and moving forward, they will be completely replacing the simulators with real devices. Meantime if you're facing issues with real devices (like no
reaction within specified time intervals) you can use simulators.

####List of iOS simulators
- `device: 'iPad 3rd', 'os_version': '5.1'`
- `device: 'iPad 3rd (6.0)', 'os_version': '6.0'`
- `device: 'iPad Mini', 'os_version': '7.0'`
- `device: 'iPad 4th', 'os_version': '7.0'`
- `device: 'iPhone 4S', 'os_version': '5.1'`
- `device: 'iPhone 4S (6.0)', 'os_version': '6.0'`
- `device: 'iPhone 5', 'os_version': '6.0'`
- `device: 'iPhone 5S', 'os_version': '7.0'`

####Example
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


[BrowserStack's REST API documentation](http://www.browserstack.com/automate/rest-api#rest-api-browsers) 
explains how to retrieve a list of desired capabilities for browsers.

For an example project, check out Karma's [e2e test](https://github.com/karma-runner/karma/tree/master/test/e2e/browserstack).


----

For more information on Karma see the [homepage](http://karma-runner.github.io).
