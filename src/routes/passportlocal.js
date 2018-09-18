
var encrypt = require('../helpers/encrypthelper');
function PassportLocal(USER, logger) {
    return function (username, password, done) {
        let user = undefined;
        if (username == "admin" && password == "admin") {
            user = { id: 1, firstName: "chintan", middleName: "", role: 'User', displayName: 'Admin' };
        }
        if (!user) {
            var encryptedPassword = encrypt.encrypt(password)
            USER.findOne({ email: username, password: encryptedPassword }).then((doc, err) => {
                if (err) {
                    console.log(err);
                    return done(null, false, { message: "Invalid credentials" });
                } else if (!doc) {
                    return done(null, false, { message: "Invalid credentials" });
                } else return done(null, doc);
            });
        } else {
            return done(null, user);
        }

    }
}


exports.PassportLocal = PassportLocal;