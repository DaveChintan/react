var GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
var config = require('../config/config');
//var passportLocal = require('./passportlocal')
//var passport = require('passport')

function Google(USER, logger, emailHelper, passport) {
    passport.use(new GoogleStrategy(
        {
            clientID: config.PROVIDERS.GOOGLE.CLIENT_ID,
            clientSecret: config.PROVIDERS.GOOGLE.CLIENT_SECRET,
            callbackURL: config.PROVIDERS.GOOGLE.REDIRECT_URL,
            scope: [
                "openid",
                "profile",
                "email",
                "https://www.googleapis.com/auth/plus.profile.emails.read"
            ],
            passReqToCallback: true
        },
        function (req, accessToken, refreshToken, profile, done) {
            if (!profile.emails || !Array.isArray(profile.emails) || profile.emails.length == 0) {
                //raise error
                done('Email not returned', null);
            }
            else {
                var strEmail = profile.emails[0].value;
                var id = profile.id;
                var firstName = profile.name ? profile.name.familyName || '' : profile.name.displayName || '';
                var lastName = ''
                var displayName = profile.displayName || '';
                USER.findOne({ email: strEmail }, (err, doc) => {
                    if (err) {
                        done(err, null);
                    } else if (doc) {
                        done(null, { exists: true, doc: null });
                    } else {
                        var payload;
                        var payload = {
                            provider_id: id,
                            provider_type: "google",
                            firstName: firstName,
                            displayName: displayName,
                            lastName: lastName,
                            role: "User",
                            email: strEmail,
                            active: false,
                            password: '',
                            createdAt: new Date(),
                            modifiedAt: new Date(),
                            activationLinkExpired: false,
                            activationLinkExpiredDate: moment()
                                .add(30, "days")
                                .format("MM/DD/YYYY")
                        };
                        var u = new USER(payload);
                        (payload.activationLink =
                            req.locals.root + "/account/activate/" + u._id.toString()),
                            u.save(err => {
                                if (err)
                                    done(err, null);
                                else {
                                    emailHelper.SendActivationEmail(payload)
                                        .then(value => {
                                            done(null, { exists: false, doc: u });
                                        })
                                        .catch(err => {
                                            done(err, null);
                                        });
                                }
                            });
                    }
                });
            }
        }
    ));
}

exports.Google = Google;