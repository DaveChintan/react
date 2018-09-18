var FacebookStrategy = require("passport-facebook").Strategy;
var config = require('../config/config');

function Facebook(USER, logger, emailHelper, passport) {
    passport.use(new FacebookStrategy({
        clientID: config.PROVIDERS.FACEBOOK.CLIENT_ID,
        clientSecret: config.PROVIDERS.FACEBOOK.CLIENT_SECRET,
        callbackURL: config.PROVIDERS.FACEBOOK.REDIRECT_URL,
        profileFields: ['id', 'displayName', 'email',
            'photos', 'gender', 'link', 'locale', 'name',
            'timezone', 'updated_time', 'verified'],
        passReqToCallback: true,
        enableProof: true
    },
        function (req, accessToken, refreshToken, profile, done) {
            var url = '';
            if (profile.id)
                url = `https://graph.facebook.com/v3.0/${profile.id}?access_token=${accessToken}&fields=first_name,last_name,email,middle_name,name`;
            else
                url = `https://graph.facebook.com/v3.0/${profile._id}?access_token=${accessToken}`;
            axios.get(url, { 'access_token': accessToken }).then(hellofb => {
                var strEmail = profile
                var id = profile.id;
                var firstName = profile.name ? profile.name.familyName || '' : profile.name.displayName || '';
                var lastName = ''
                var displayName = profile.displayName || '';
                USER.findOne({ email: profile }, (err, doc) => {
                    if (err) {
                        done(err, null);
                    } else if (doc) {
                        done(null, { exists: true, doc: null });
                    } else {
                        var payload;
                        var payload = {
                            provider_id: id,
                            provider_type: "facebook",
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
            }).catch(hellofb => {
                done(hellofb, null);
            });
        }
    ));
}

exports.Facebook = Facebook;