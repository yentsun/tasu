![icon]

Tasu
====

![Tests status](https://github.com/yentsun/tasu/workflows/Tests/badge.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/yentsun/tasu/badge.svg?branch=master)](https://coveralls.io/github/yentsun/tasu?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/yentsun/tasu/badge.svg?targetFile=package.json)](https://snyk.io/test/github/yentsun/tasu?targetFile=package.json)

An `async/await` wrapper over [node-nats](https://github.com/nats-io/node-nats),
designed to easily integrate with your microservice code. Taşuu (ташуу)
is 'transport' in Kyrgyz.


Installation
------------

```
npm i tasu
```

Usage
-----

Create an instance of the transport:

```js
import Tasuu from 'tasu';

async function main()  {
    ...
    const tasu = new Tasuu({ group: 'some-service', ...});
    await tasu.connected();
}

```


Publish a request and get a response via `tasu.request()` on one end:

```js
const { bar } = await tasu.request('foo', { rg: 1 });
```
_Note: this method uses `requestOne` inside, no need to worry about max  
responses_ 


Subscribe and respond to a request on the other:

```js
tasu.listen('foo', async ({ arg }, respond) => {
    const bar = await someDatabaseCall(arg);
    return { bar };
});
```


_Note: A listener is automatically added to queue group `foo.listeners`;
errors of the handling function are caught and sent back as error response_


Publish an event on one end:

```js
tasu.publish('some.package.sent', {...});
```

Subscribe and process as worker queue on the other:

```js
 tasu.process('*.package.sent', (pack, subject) => {
    console.log(subject, pack);
});
```

`listen`, `subscribe` and `process` methods return an integer
subscription ID (SID) which can be used to unsubscribe from a subject:

```js
const sid = tasu.process('*.package.sent', (pack, subject) => {
    console.log(subject, pack);
});

...

tasu.unsubscribe(sid);
```
The above technique is useful for websocket connections.


Close NATS connection (if needed):

```js
tasu.close();
```


Configuration
-------------

You can set the following config options while creating a new Tasu
instance:

- `url` - NATS connection urls, default: `nats://localhost:4222`
- `group` - group name this transport will be assigned to, default: `default`
- `requestTimeout` - how long to wait for response on NATS requests,
  default: `10000`
- `level` - set log level for provided logger. Default is `debug`
- `logger` - define custom logger. Should basically have `info`,
  `debug`, `error` methods.


API
---

- **connected()** - returns a promise resolved on successful connection to
  NATS server. You basically always want this resolved before proceeding
  with Tasu.

- **publish(subject, message)** - *optimistically* publish a `message`
  to a `subject`. TODO: make this return a promise too.

- **listen(subject, async (message)=>{...})** - subscribes to a `subject`
  and respond via handler function. Handler function must be defined via
  `async`, it gets `message` object as the only argument and *must
  return something* as successful response. Errors are caught and sent
  back as error response. Returns subscription id.

- **subscribe(subject, (message, replyTo, subject)=>{...})** - subscribes
  to a `subject` and process *messages* with handler function. All
  memebers of the *group* will get subject messages. Returns subscription
  id.

- **subOnce(subject, (message, subject)=>{...})** - same as `subscribe()`
  but unsubscribes immediately after receiving a message.

- **process(subject, (message, subject)=>{...})** - subscribes to a
  `subject` as a queue worker and processes *messages* via handler
  function. Messages will be distributed randomly among free group
  members. Returns subscription id.

- **request(subject\[, message\])** - performs a request and returns a
  response promise.

- **unsubscribe(sid)** - unsubscribes from subscription identified by
  `sid` (returned by `subscribe`, `subOnce`, `process`, `listen`)

- **close()** - closes connection to NATS. Always try to exit gracefully,
  otherwise the connection will persist until next heartbeat.


Credits
-------

Icons by [icons8](https://icons8.com)

[icon]: icons8-hub-64.png
