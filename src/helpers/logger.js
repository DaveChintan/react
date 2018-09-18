var winston = require('winston');
const Transport = require('winston-transport')
module.exports = (config) => {
    _config = config;
    winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        transports: [
            new winston.transports.Console()
        ]
    })
    return {
        log: async function (level, msg, next) {
            return new Promise((resolve, reject) => {
                resolve(next());
            });
        }
    }
}