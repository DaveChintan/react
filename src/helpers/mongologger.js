var winston = require('winston');
const Transport = require('winston-transport')

module.exports = class MongoLogger extends Transport {
    _opts
    _errorModel
    constructor(opts, errorModel) {
        super(opts);
        this._opts = opts;
        this._errorModel = errorModel;
    }

    log(info, callback) {
        setImmediate(() => { this.emit("logged", info) });
        var error = new Error({});
        this._errorModel.save()
        callback(null, true);
    }
}
