const {assert} = require('chai');
const Transport = require('./');


const tp = new Transport({url: 'nats://localhost:4222', group: 'tests', requestTimeout: 100}); // a nats server should be running
let nats;
tp.on('error', () => {
    process.exit(1);
});

describe('wrapper', () => {

    before((done) => {
        tp.on('connect', () => {
            nats = tp._nats;
            done();
        });
    });

    describe('request', () => {

        before((done) => {
            tp.listen('request.ok', (message, respond) => {
                respond(null, message);
            });
            tp.listen('request.password', (message, respond) => {
                respond(null, message);
            });
            tp.listen('request.error', (message, respond) => {
                respond(new Error('service error'));
            });
            tp.listen('request.empty', (message, respond) => {
                respond(null, null);
            });
            tp.listen('request.error.detail', (message, respond) => {
                respond({detail: 'service error'}, null);
            });
            done();
        });

        it('performs a request and returns successful result', async () => {
            const {foo} = await tp.request('request.ok', {foo: 'bar'});
            assert.equal(foo, 'bar');
        });

        it('performs a request and screens password field in logs', async () => {
            const response = await tp.request('request.password', {
                password: 'should not see this',
                data: {password: 'should not see this also'}
                });
            assert.equal(response.password, 'should not see this');
            assert.equal(response.data.password, 'should not see this also');
        });

        it('performs a request and returns error', async () => {
            try {
                await tp.request('request.error', {foo: 'bar'});
            } catch (error) {
                assert.equal(error.message, 'service error');
            }
        });

        it('performs a request and returns an empty response', async () => {
            const response = await tp.request('request.empty', {foo: 'bar'});
            assert.isNull(response);
        });

        it('performs a request and returns error from error.detail', async () => {
            try {
                await tp.request('request.error.detail', {foo: 'bar'});
            } catch (error) {
                assert.equal(error.message, 'service error');
            }
        });

        it('performs a request and returns timeout error', async () => {
            try {
                await tp.request('request.timeout', {foo: 'bar'});
            } catch (error) {
                assert.equal(error.message, 'response timeout');
            }
        }).timeout(110);
    });

    describe('subscribe', () => {
        it('performs a response-subscription to a subject', (done) => {
            tp.subscribe('broadcast', (message, replyTo, subject) => {
                assert.equal(message.foo, 'bar');
                assert.isNotOk(replyTo);
                assert.equal(subject, 'broadcast');
                done()
            });
            tp.publish('broadcast', {foo: 'bar'});
        })
    });

    describe('listen', () => {
        it('listens to requests', async () => {
            tp.listen('request.listen', (message, respond) => {
                assert.equal(message.foo, 'bar');
                respond(null, {bar: 'foo'});
            });
            const {bar} = await tp.request('request.listen', {foo: 'bar'});
            assert.equal(bar, 'foo');
        })
    });

    describe('process', () => {
        it('process a queue message as group member', (done) => {
            tp.process('process', (message, subject) => {
                assert.equal(message.foo, 'bar');
                assert.equal(subject, 'process');
                done()
            });
            tp.publish('process', {foo: 'bar'});
        })
    });

    describe('publish', () => {
        it('publishes a message to a subject', (done) => {
            tp.process('publish', (message) => {
                assert.equal(message.message, 'yay!');
                done();
            });
            tp.publish('publish', {message: 'yay!'});
        });
    });

    describe('unsubscribe', () => {
        it('unsubscribes from NATS subject', (done) => {
            const sid = tp.subscribe('unsubscribe', ()=>{});
            tp._nats.once('unsubscribe', (subId, subject) => {
                assert.equal(subId, sid);
                assert.equal(subject, 'unsubscribe');
                done();
            });
            tp.unsubscribe(sid);
        })
    });

    describe('subOnce', () => {
        it('subscribes, gets one message and unsubscribes', (done) => {
            const sid = tp.subOnce('subOnce', (message) => {
                assert.equal(message.foo, 'onced'); // FIXME no assertion here
            });
            tp.publish('subOnce', {foo: 'once'});
            tp._nats.once('unsubscribe', (subId, subject) => {
                assert.equal(subId, sid);
                assert.equal(subject, 'subOnce');
                done();
            });
        });
    });

    describe('close', () => {
        it('closes underlying connection with NATS', (done) => {
            tp.close();
            assert.isTrue(tp._nats.closed);
            done();
        })
    });

});
