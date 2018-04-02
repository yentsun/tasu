![icon]

Tasu
====

A wrapper over [node-nats](https://github.com/nats-io/node-nats), designed
to easily integrate with your microservice code. Taşuu (ташуу) is 'transport'
in Kyrgyz.

[![Build Status](https://travis-ci.org/yentsun/tasu.svg?branch=master)](https://travis-ci.org/yentsun/tasu)
[![Coverage Status](https://coveralls.io/repos/github/yentsun/tasu/badge.svg?branch=master)](https://coveralls.io/github/yentsun/tasu?branch=master)


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
     // transport is ready at this point
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
tasu.listen('foo', async ({arg}, respond) => {

    const bar = await someAsyncFunction(arg);
    return {bar};
});
```


_Note: A listener is automatically added to queue group `foo.listeners`;
errors of the handling function are caught and sent back as error response_


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
---------------------

- `NATS_LOG_LEVEL` - set wrapper's log level. Default is `debug`


Credits
-------

Icons by [icons8](https://icons8.com)

[icon]: icons8-hub-64.png