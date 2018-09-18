var LocalStrategy = require("passport-local").Strategy;
//var FacebookStrategy = require("passport-facebook").Strategy;
//var encrypt = require('../helpers/encrypthelper');
//var config = require('../config/config');
var passportLocal = require('./passportlocal')
var google = require('./google');
var facebook = require('./facebook');
//var passport = require('passport')

function ConfigurePassport(passport, USER, logger, emailHelper) {
    passport.serializeUser(function (user, done) {
        var userSchema = {};
        userSchema.email = user.email;
        userSchema.firstName = user.firstName;
        userSchema.middleName = user.middleName;
        userSchema.displayName = user.displayName;
        userSchema.role = user.role;
        done(null, userSchema);
      });

      passport.deserializeUser(function (user, done) {
        done(null, user);
      });
    var ls = passportLocal.PassportLocal(USER, logger);
    passport.use(new LocalStrategy(ls));
    //configure google
    var gl = google.Google(USER, logger, emailHelper, passport);
    //configure facebook
    var fb = facebook.Facebook(USER, logger, emailHelper, passport);
}

exports.ConfigurePassport = ConfigurePassport;