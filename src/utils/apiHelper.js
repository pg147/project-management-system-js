export class APIResponse {
    constructor (statusCode, data, message = 'Success') {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
    }
}

export class APIError extends Error {
    constructor (statusCode, message, errors = [], stack = "") {
        super(message);

        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;

        if (stack) {
            this.stack = stack;
        } else Error.captureStackTrace(this, this.constructor);
    }
}
