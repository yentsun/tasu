const nats = require('nats');
const {EventEmitter} = require('events');
const merge = require('lodash/merge');
const hyperid = require('hyperid');
const Logger = require('./lib/logger');


module.exports = class extends EventEmitter {

    constructor(options) {
        super();
        const defaults = {
            url: 'nats://localhost:4222',
            requestTimeout: 10000,
            group: 'default'
        };
        this._options = options ? merge(defaults, options) : defaults;
        this._logger = this._options.logger || Logger(this._options.group);
        this._nats = nats.connect(options);
        this._instance = hyperid();
        this.id = this._instance();
        this.group = this._options.group;

        // async style
        this.readyPromise = new Promise(resolve => {
            this._nats.on('connect', () => {resolve()}); // TODO try to call `resolve` from general on.connect subscriber (below)
        });

        this._nats.on('connect', () => {
            this._state = 'connected';
            this._logger.info('connected to NATS server:', this._nats.currentServer.url.host);
            this._logger.info('id:', this.id);
            this._logger.info('group:', this._options.group);
            this.emit('connect');
        });
        this._nats.on('error', (error) => {
            this._logger.error(error.message);
            this.emit('error', error);
        });
        this._nats.on('disconnect', () => {
            if (this._state === 'connected') {
                this._logger.error('DISCONNECTED!');
            }
            this._state = 'disconnected';
        });
        this._nats.on('reconnecting', () => {
            this._logger.info('reconnecting');
        });
        this._nats.on('reconnect', () => {
            this._state = 'connected';
            this._logger.info('connection RESTORED!');
        });

    }

    // async style
    connected() {
        return this.readyPromise;
    }

    publish(subject, message) {
        this._logger.debug('publishing to', subject, message);
        this._nats.publish(subject, JSON.stringify(message), () => {
            this._logger.debug('message published', subject, message)
        })
    };

    // returned by `listen`, not to be used directly
    _respond(replyTo) {
        return (error, response) => {
            if (error) {
                this._logger.debug('sending error response to', replyTo, error);
                this._nats.publish(replyTo, JSON.stringify([{message: error.message || error.detail, stack: error.stack}]), () => {
                    this._logger.debug('error response sent to', replyTo)
                })
            } else {
                this._nats.publish(replyTo, JSON.stringify([null, response]), () => {
                })
            }
        }
    };

    // subscribe to point-to-point requests
    listen(subject, done) {
        const group = subject + '.listeners';
        this._logger.debug('subscribing to requests', subject, 'as member of', group);
        return this._nats.subscribe(subject, {queue: group}, (message, reply) => {
            done(JSON.parse(message), this._respond(reply))
        })
    };

    // subscribe to broadcasts
    subscribe(subject, done) {
        this._logger.debug('subscribing to broadcasts', subject);
        return this._nats.subscribe(subject, (message, replyTo, subject) => {
            this._logger.debug('got broadcast', subject, message);
            done(JSON.parse(message), replyTo, subject);
        })
    };

    // subscribe as queue worker
    process(subject, done) {
        const group = subject + '.workers.' + this._options.group;
        this._logger.debug('subscribing to process', subject, 'queue as member of', group);
        return this._nats.subscribe(subject, {queue: group}, (message, reply, subject) => {
            this._logger.debug('processing', subject, message);
            done(JSON.parse(message), subject);
        })
    };

    // request one response
    request(subject, message) {
        const meta = JSON.parse(JSON.stringify(message));  // important to clone here, as we are rewriting meta
        const id = this._instance();
        this._logger.debug('[>>', id, '>>]', subject, meta);
        return new Promise((resolve, reject) => {
            this._nats.requestOne(subject, JSON.stringify(message), null, this._options.requestTimeout, (response) => {
                if (response.code && response.code === nats.REQ_TIMEOUT) {
                    this._logger.error('[!!', id, '!!] timeout', subject, message);
                    reject(new Error('response timeout'));
                } else {
                    const [error, res] = JSON.parse(response);
                    if (error) {
                        this._logger.error('[!!', id, '!!] ', error.message, error.stack);
                        reject(new Error(error.message));
                    } else {
                        const meta = JSON.parse(JSON.stringify(res));
                        this._logger.debug('[<<', id, '<<]', subject, meta);
                        resolve(res);
                    }
                }
            })
        });
    };

    // unsubscribe from subscription by id
    unsubscribe(sid) {
        this._logger.debug(`unsubscribing from ${sid}`);
        this._nats.unsubscribe(sid);
    };

    // subscribe, receive, unsubscribe
    subOnce(subject, done) {
        this._logger.debug(`subscribing once to ${subject}...`);
        const sid = this._nats.subscribe(subject, (message, replyTo, subject) => {
            this._logger.debug('got message', subject, message, '- unsubscribing from', sid);
            this._nats.unsubscribe(sid);
            done(JSON.parse(message), subject);
        });
        return sid;
    }

    // close underlying connection with NATS
    close() {
        this._logger.info('closing connection with NATS:', this._nats.currentServer.url.host);
        this._nats.close();
    }
};