[4.3.1] - 2020-10-19
--------------------
- [x] Update dependencies


[4.3.0] - 2019-07-06
--------------------
- [x] Drop `lodash.merge` dependency
- [x] Bump `nats` version to 1.3.0
- [x] Bump Go version to 1.11 (for test NATS process)


[4.2.1] - 2018-07-17
--------------------
- [x] Increase Go version to 1.9
- [x] Fix vulnerabilities


[4.1.1] - 2018-04-15
--------------------
- [x] Update `trid` version


[4.1.0] - 2018-04-05
--------------------
- [x] Throw errors instead of emitting
- [x] Drop `EventEmitter` extension
- [x] Fix documentation #7
- [x] Remove formatter from logger options
- [x] Allow `request(subject)` without messages


[4.0.1] - 2018-04-02
--------------------
- [x] Fix error detail tests
- [x] Drop `moment` dependency


[4.0.0] - 2018-04-02
--------------------
- [x] Remove `respond` callback from `listen`
- [x] Move to `trid` for ids
- [x] Formattable logger


[3.3.0] - 2018-03-30
--------------------
- [x] Add custom error class #8


[3.2.2] - 2018-03-30
--------------------
- [x] Change `nats` to `tasu` @ logger


[3.2.1] - 2018-03-22
--------------------
- [x] Add `engines` to npm package


[3.2.0] - 2018-02-22
--------------------
- [x] Cover code to 100% (well, 99% actually) #6


[3.1.3] - 2018-02-22
--------------------
- [x] Add more keywords to `package.json`
- [x] Add coveralls with nyc #5


[3.1.0] - 2018-02-19
--------------------
- [x] Add 'async style' connected state handling
- [x] Update dependencies


[3.0.0] - 2017-12-19
--------------------
- [x] Move requests to promise-based scheme fix #1


[2.1.2] - 2017-10-13
--------------------
- [x] Remove 'debug' level from stderr stream @ logger


[2.1.1] - 2017-09-30
--------------------
- [x] ADDED deeper password screening


[2.1.0] - 2017-09-28
--------------------
- [x] ADDED one-time subscription


[2.0.2] - 2017-09-28
--------------------
- [x] FIXED some typos


[2.0.0] - 2017-09-15
--------------------
- [x] ADDED ids to request/response
- [x] ADDED `connected` event handling
- [x] CHANGE sinon mocks to live NATS connection @ tests
- [x] REMOVED js standard


[1.6.0] - 2017-08-02
--------------------
- [x] ADDED password screening


[1.5.4] - 2017-07-03
--------------------
- [x] ADDED more info @ error response logging


[1.5.3] - 2017-05-21
--------------------
- [x] ADDED `unsubscribe` method
- [x] ADDED more info @ error response logging


[1.5.2] - 2017-05-17
--------------------
- [x] ADDED error.stack to error response log entry


[1.5.1] - 2017-05-13
--------------------
- [x] ADDED option to override default logger


[1.5.0] - 2017-05-10
--------------------
- [x] ADDED `group` parameter to queue subscriptions


[1.4.0] - 2017-04-15
--------------------
- [x] CHANGED `response` behavior to always return JSON array with error as first element and message as the second


[1.3.4] - 2017-04-14
--------------------
- [x] ADDED `close` method which closes underlying NATS connection


[1.3.3] - 2017-04-04
--------------------
- [x] FIXED empty response handling


[1.3.2] - 2017-04-04
--------------------
- [x] FIXED options loading


[1.3.1] - 2017-03-17
--------------------
- [x] FIXED error serialization


[1.3.0] - 2017-03-17
--------------------
- [x] ADDED `respond` function as part of returned params from `listen`


[1.2.0] - 2017-03-17
--------------------
- [x] ADDED `listen` method to subscribe to point-to-point requests
- [x] Standard JS polish


[1.1.0] - 2017-03-15
--------------------
- [x] ADDED readme
- [x] ADDED `respond` method
- [x] ADDED `process` method to subscribe to a queue group
- [x] REMOVE `options` argument from `subscribe`


[1.0.0] - 2017-03-12
--------------------
- [x] CHANGED request response to return unwrapped object


[0.2.2] - 2017-03-08
--------------------
- [x] CHANGED request logging from verbs to arrows


[0.2.1] - 2017-03-03
--------------------
- [x] CHANGED default log level to `debug`


[0.2.0] - 2017-03-01
--------------------
- [x] ADDED `error.detail` (pg) support


[0.1.2] - 2017-02-28
--------------------
- [x] ADDED default options


[0.1.1] - 2017-02-28
--------------------
- [x] CHANGED initial response timeout to 1000


[0.1.0] - 2017-02-28
--------------------
- [x] ADDED `request` method
- [x] ADDED `publish` method
- [x] ADDED `subscribe` method
