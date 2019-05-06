var express = require('express');
var passport = require('passport');
var router = express.Router();


router.post('/callback', function (req, res, next) {
    passport.authenticate('azuread-openidconnect',
        {
            response: res,
            session: false,
        }, (err, user, info) => {
            if (err)
                res.render('index', { err: err });
            else {
                req.session.user = user;
                res.redirect('/');
            }
        }
    )(req, res, next)
})


module.exports = router;