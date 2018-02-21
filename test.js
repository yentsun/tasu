const {assert} = require('chai');
const Taşuu = require('./');


describe('empty constructor options', () => {

    const tasu = new Taşuu();
    tasu.on('error', () => {
        process.exit(1);
    });

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


describe('tasu', () => {

    const tasu = new Taşuu({  // a nats server should be running
        url: 'nats://localhost:4222',
        group: 'tests',
        requestTimeout: 100
    });
    tasu.on('error', () => {
        process.exit(1);
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
            }
        });

        it('performs a request and returns timeout error', async () => {
            try {
                await tasu.request('request.timeout', {foo: 'bar'});
            } catch (error) {
                assert.equal(error.message, 'response timeout');
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

    describe('close', () => {
        it('closes underlying connection with NATS', (done) => {
            tasu.close();
            assert.isTrue(tasu._nats.closed);
            done();
        })
    });

});
