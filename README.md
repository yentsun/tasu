Tasu
====

!(travis build)[https://travis-ci.org/yentsun/tasu.svg?branch=master]

A wrapper over [node-nats](https://github.com/nats-io/node-nats), designed
to easily integrate with your code. Taşuu (ташуу) is 'transport' in Kyrgyz.


Installation
------------

```
npm i tasu
```

Usage
-----

Create an instance of the transport:

```js
const Tasuu = require('tasu');


const tasu = new Tasuu({group: 'some-service'});
 tasu.on('connect', () => {
     // wrapper is ready at this point
 });
 tasu.on('error', (error) => {
     throw error;
 });
```


Publish a request and get a response via async/await:

```js
async () => {
    const {bar} = await tasu.request('foo', {arg: 1});
    ...
};

```
_Note: this method uses `requestOne` inside, no need to worry about max  
responses_ 


Subscribe and respond to a request:

```js
tasu.listen('foo', ({arg}, respond) => {
    ...
    respond(error, {bar: 2});
});
```

_Note: a listener is automatically added to queue group `some.request.listeners`_


Publish an event:

```js
tasu.publish('some.package.sent', {...});
```

Subscribe and process as worker queue:

```js
 tasu.process('*.package.sent', (pack, subject) => {
    console.log(subject, pack);
});
```

`listen`, `subscribe` and `process` methods return an integer subscription ID (SID) which can be used to unsubscribe from a subject:

```js
const sid = tasu.process('*.package.sent', (pack, subject) => {
    console.log(subject, pack);
});

// ...

tasu.unsubscribe(sid);
```

Close NATS connection (if needed):

```js
tasu.close();
```

Environment variables
=====================

- `NATS_LOG_LEVEL` - set wrapper's log level. Default is `debug`
