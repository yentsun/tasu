module.exports = class RequestError extends Error {

    constructor(message, requestId) {

        super(message || 'request error');
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
        this.requestId = requestId;
    }
};
