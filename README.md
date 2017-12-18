YT-Transport
============

A wrapper over [node-nats](https://github.com/nats-io/node-nats), designed
to easily integrate with your code.


Installation
------------

```
npm install yentsun/transport
```

Usage
-----

Create an instance of the wrapper:

```js
import Transport from 'yt-transport';

const tp = new Transport({group: 'some-service'});
 tp.on('connect', () => {
     // wrapper is ready at this point
 });
 tp.on('error', (error) => {
     throw error;
 });
```


Publish a request and get a response via async/await:

```js
async () => {
    const {bar} = await tp.request('foo', {arg: 1});
    ...
};

```
_Note: this method uses `requestOne` inside, no need to worry about max  
responses_ 


Subscribe and respond to a request:

```js
tp.listen('foo', ({arg}, respond) => {
    ...
    respond(error, {bar: 2});
});
```

_Note: a listener is automatically added to queue group `some.request.listeners`_


Publish an event:

```js
tp.publish('some.package.sent', {...});
```

Subscribe and process as worker queue:

```js
 tp.process('*.package.sent', (pack, subject) => {
    console.log(subject, pack);
});
```

`listen`, `subscribe` and `process` methods return an integer subscription ID (SID) which can be used to unsubscribe from a subject:

```js
const sid = tp.process('*.package.sent', (pack, subject) => {
    console.log(subject, pack);
});

// ...

tp.unsubscribe(sid);
```

Close NATS connection (if needed):

```js
tp.close();
```

Environment variables
=====================

- `NATS_LOG_LEVEL` - set wrapper's log level. Default is `debug`
