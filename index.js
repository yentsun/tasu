const nats = require('nats');
const merge = require('lodash/merge');
const TRID = require('trid');
const Logger = require('./lib/logger');
const RequestError = require('./lib/RequestError');


module.exports = class {

    constructor(options) {

        const defaults = {
            url: 'nats://localhost:4222',
            requestTimeout: 10000,
            group: 'default',
        };
        this._options = options ? merge(defaults, options) : defaults;
        const {group, formatter, level} = this._options;
        this._logger = this._options.logger || Logger({group, formatter, level});
        this._nats = nats.connect(options);
        this._trid = new TRID({prefix: this._options.group});
        this.id = this._trid.base();
        this.group = this._options.group;

        this.readyPromise = new Promise(resolve => {

            this._nats.on('connect', () => {
                this._state = 'connected';
                this._logger.info('connected to NATS server:', this._nats.currentServer.url.host);
                this._logger.info('id:', this.id);
                this._logger.info('group:', this._options.group);
                resolve()
            });
        });

        this._nats.on('error', (error) => {

            this._logger.error(`${error.message}${error.code ? ' (code: '+error.code+')' : ''}`);
            if (error.code === 'CONN_ERR') {
                process.exit(1);
            }
            else
                throw error;
        });

        this._nats.on('disconnect', () => {

            if (this._state === 'connected') {
                this._logger.error('nats disconnected');
            }
            this._state = 'disconnected';
        });

        this._nats.on('reconnecting', () => {

            this._state = 'reconnecting';
            this._logger.info('nats reconnecting');
        });

        this._nats.on('reconnect', () => {

            this._state = 'connected';
            this._logger.info('nats reconnected');
        });
    }


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

    _respond(error, replyTo, response) {

        if (error) {
            this._logger.debug('sending error response to', replyTo, error);
            this._nats.publish(replyTo, JSON.stringify([{message: error.message || error.detail, stack: error.stack}]), () => {
                this._logger.debug('error response sent to', replyTo)
            })
        } else {
            this._nats.publish(replyTo, JSON.stringify([null, response]), () => {
            })
        }
    };


    // subscribe to point-to-point requests

    listen(subject, done) {

        const group = subject + '.listeners';
        this._logger.debug('subscribing to requests', subject, 'as member of', group);
        return this._nats.subscribe(subject, {queue: group}, async (message, reply) => {
            try {
                const result = await done(JSON.parse(message));
                this._respond(null, reply, result);
            } catch (error) {
                this._respond(error, reply);
            }
        });
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
        const id = this._trid.seq();
        this._logger.debug('[>>', id, '>>]', subject, meta);
        return new Promise((resolve, reject) => {
            this._nats.requestOne(subject, JSON.stringify(message), null, this._options.requestTimeout, (response) => {
                if (response.code && response.code === nats.REQ_TIMEOUT) {
                    this._logger.error('[!!', id, '!!] timeout', subject, message);
                    reject(new RequestError('response timeout', id));
                } else {
                    const [error, res] = JSON.parse(response);
                    if (error) {
                        this._logger.error('[!!', id, '!!] ', error.message, error.stack);
                        reject(new RequestError(error.message, id));
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