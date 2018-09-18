var mailer = require('nodemailer');
var config = require('../config/config');

function EmailHelper(configg) {
    return {
        SendEmail: function (aTo, aCC, subject, body, attachment) {
            return new Promise((resolve, reject) => {
                const transporter = mailer.createTransport({
                    host: config.SMTP_HOST, // hostname
                    port: config.SMTP_PORT, // secure:true for port 465, secure:false for port 587
                    secure: config.SMTP_SECURE == "1" ? true : false, // port for secure SMTP
                    auth: {
                        user: config.SMTP_USERNAME,
                        pass: config.SMTP_PASSWORD
                    }
                });
                transporter.verify((error, success) => {
                    if (error) {
                        reject(error);
                    }
                });
                transporter.sendMail({
                    from: config.SMTP_FROM, to: aTo, subject: subject,
                    html: body
                }).then(value => {
                    transporter.close();
                    resolve();
                }).catch(err => {
                    transporter.close();
                    reject(err);
                });
            });
        },
        SendActivationEmail: function (payload) {
            return new Promise((resolve, reject) => {
                this.SendEmail(payload.email, null,
                    'Account Verification', `<a href=${payload.activationLink}>Click here to activate</a>`)
                    .then(resolve)
                    .catch(reject);
            });
        }
    }
}


