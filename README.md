# karma-browserstack-launcher

> Use any browser on [BrowserStack](http://www.browserstack.com/)!

**NOTE:** You have to run local tunnel first:
```bash
$ java -jar BrowserStackTunnel.jar <KEY> localhost,9876,0
```


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
        os: 'mac',
        version: '21.0'
      }
    },

    browsers: ['bs_firefox_mac']
  });
};
```

### Global options
- `username` your BS username (email), you can also use `BROWSER_STACK_USERNAME` env variable.
- `accessKey` your BS access key (password), you can also use `BROWSER_STACK_ACCESS_KEY` env variable.
- `startTunnel` do you wanna establish the BrowserStack tunnel ? (defaults to `true`)


### Per browser options
- `browser` name of the browser
- `version` version of the browser
- `os` which platform ?

For an example project of, check out Karma's [e2e test](https://github.com/karma-runner/karma/tree/master/test/e2e/browserstack).


----

For more information on Karma see the [homepage](http://karma-runner.github.io).
