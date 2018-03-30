const {assert} = require('chai');
const Tasuu = require('./');
const sinon = require('sinon');


describe('tasu: empty options', () => {

    const tasu = new Tasuu();

    before((done) => {
        tasu.on('connect', () => {
            done();
        });
    });

    it('runs ok', (done) => {
        assert.isOk(tasu.id);
        assert.equal(tasu.group, 'default');
        done();
    });

});


describe('tasu: options set', () => {

    const tasu = new Tasuu({  // a nats server should be running
        url: 'nats://localhost:4222',
        group: 'tests',
        requestTimeout: 100
    });

    before(async () => {
        await tasu.connected();
    });

    describe('request', () => {

        before((done) => {
            tasu.listen('request.ok', (message, respond) => {
                respond(null, message);
            });
            tasu.listen('request.password', (message, respond) => {
                respond(null, message);
            });
            tasu.listen('request.error', (message, respond) => {
                respond(new Error('service error'));
            });
            tasu.listen('request.empty', (message, respond) => {
                respond(null, null);
            });
            tasu.listen('request.error.detail', (message, respond) => {
                respond({detail: 'service error'}, null);
            });
            done();
        });

        it('performs a request and returns successful result', async () => {
            const {foo} = await tasu.request('request.ok', {foo: 'bar'});
            assert.equal(foo, 'bar');
        });

        it('performs a request and screens password field in logs', async () => {
            const response = await tasu.request('request.password', {
                password: 'should not see this',
                data: {password: 'should not see this also'}
                });
            assert.equal(response.password, 'should not see this');
            assert.equal(response.data.password, 'should not see this also');
        });

        it('performs a request and returns error', async () => {
            try {
                await tasu.request('request.error', {foo: 'bar'});
            } catch (error) {
                assert.equal(error.message, 'service error');
                assert.isOk(error.requestId);
            }
        });

        it('performs a request and returns an empty response', async () => {
            const response = await tasu.request('request.empty', {foo: 'bar'});
            assert.isNull(response);
        });

        it('performs a request and returns error from error.detail', async () => {
            try {
                await tasu.request('request.error.detail', {foo: 'bar'});
            } catch (error) {
                assert.equal(error.message, 'service error');
                assert.isOk(error.requestId);
            }
        });

        it('performs a request and returns timeout error', async () => {
            try {
                await tasu.request('request.timeout', {foo: 'bar'});
            } catch (error) {
                assert.equal(error.message, 'response timeout');
                assert.isOk(error.requestId);
            }
        }).timeout(110);
    });

    describe('subscribe', () => {

        it('performs a response-subscription to a subject', (done) => {
            tasu.subscribe('broadcast', (message, replyTo, subject) => {
                assert.equal(message.foo, 'bar');
                assert.isNotOk(replyTo);
                assert.equal(subject, 'broadcast');
                done()
            });
            tasu.publish('broadcast', {foo: 'bar'});
        })
    });

    describe('listen', () => {

        it('listens to requests', async () => {
            tasu.listen('request.listen', (message, respond) => {
                assert.equal(message.foo, 'bar');
                respond(null, {bar: 'foo'});
            });
            const {bar} = await tasu.request('request.listen', {foo: 'bar'});
            assert.equal(bar, 'foo');
        })
    });

    describe('process', () => {

        it('process a queue message as group member', (done) => {
            tasu.process('process', (message, subject) => {
                assert.equal(message.foo, 'bar');
                assert.equal(subject, 'process');
                done()
            });
            tasu.publish('process', {foo: 'bar'});
        })
    });

    describe('publish', () => {

        it('publishes a message to a subject', (done) => {
            tasu.process('publish', (message) => {
                assert.equal(message.message, 'yay!');
                done();
            });
            tasu.publish('publish', {message: 'yay!'});
        });
    });

    describe('unsubscribe', () => {

        it('unsubscribes from NATS subject', (done) => {
            const sid = tasu.subscribe('unsubscribe', ()=>{});
            tasu._nats.once('unsubscribe', (subId, subject) => {
                assert.equal(subId, sid);
                assert.equal(subject, 'unsubscribe');
                done();
            });
            tasu.unsubscribe(sid);
        })
    });

    describe('subOnce', () => {

        it('subscribes, gets one message and unsubscribes', (done) => {
            const sid = tasu.subOnce('subOnce', (message) => {
                assert.equal(message.foo, 'onced'); // FIXME no assertion here
            });
            tasu.publish('subOnce', {foo: 'once'});
            tasu._nats.once('unsubscribe', (subId, subject) => {
                assert.equal(subId, sid);
                assert.equal(subject, 'subOnce');
                done();
            });
        });
    });

    describe('nats error event', () => {

        it('emits error too', (done) => {
            tasu.on('error', (error) => {
                assert.equal(error.message, 'synthetic error');
                done();
            });
            try {
                const error = new Error('synthetic error');
                tasu._nats.emit('error', error);
            } catch (error) {}

        });

        it('exits on connection error', (done) => {
            const sandbox = sinon.sandbox.create({useFakeTimers : true});
            const exitStub  = sandbox.stub(process, 'exit');
            const error = new Error('synthetic connection error');
            error.code = 'CONN_ERR';
            tasu._nats.emit('error', error);
            sinon.assert.calledOnce(exitStub);
            sandbox.restore();
            done();
        })
    });

    describe('connection events', () => {

        it('handles disconnect', (done) => {
            tasu._nats.emit('disconnect');
            assert.equal(tasu._state, 'disconnected');
            done();
        });

        it('handles reconnecting', (done) => {
            tasu._nats.emit('reconnecting');
            assert.equal(tasu._state, 'reconnecting');
            done();
        });

        it('handles reconnect', (done) => {
            tasu._nats.emit('reconnect');
            assert.equal(tasu._state, 'connected');
            done();
        });
    });

    describe('close', () => {

        it('closes underlying connection with NATS', (done) => {
            tasu.close();
            assert.isTrue(tasu._nats.closed);
            done();
        })
    });

});
