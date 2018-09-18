//var auth = require('../helpers/authhelper');
//var express = require('express');
//var app = require('express')();
var user = require('./users');
//var passport = require('passport');


function RegisterAccountRoutes(router, db, logger, passport) {
    
    //var rtr = express.Router();
    var rtr = router;
    rtr.get('/', function (req, res, next) {
        if (req.isAuthenticated()) {
            res.redirect('/index');
        }
        else {
            var errormessage = "";
            res.render("./login.html", {
                errormessage: errormessage,
                email: "",
                password: ""
            });
        }
    });
    
    rtr.get('/login', function (req, res, next) {
        if (req.isAuthenticated()) {
            res.redirect('/index');
        }
        else {
            var errormessage = "";
            res.render("account/login.html", {
                errormessage: errormessage,
                email: "",
                password: ""
            });
        }
    });

    rtr.post('/login', function (req, res, next) {
        passport.authenticate("local", function (err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user) {
                var errormessage = "invalid credentials";
                // return res.redirect('/');
                return res.render("account/login.html", {
                    errormessage: errormessage
                });
            }
            req.logIn(user, function (err) {
                if (err) {
                    return next(err);
                }
                if (user.role == 'Admin')
                    return res.redirect("/users");
                else
                    return res.redirect("/index");
            });
        })(req, res, next);
    });

    rtr.post("/logout", function (req, res, next) {
        req.session.destroy();
        req.session.logout();
        res.redirect("/");
    });

    rtr.get("/signup/google", passport.authenticate("google"));

    rtr.get("/auth/google/callback", function (req, res, next) {
        passport.authenticate("google", function (err, user, info) {
            if (err) {
                res.render("account/login.html", {
                    errormessage: err
                });
            }
            else if (user.exists) {
                res.render("account/login.html", {
                    errormessage: 'Email already exists'
                });
            }
            else {
                req.logIn(user.doc, function (err) {
                    if (err) {
                        res.render("account/login.html", {
                            errormessage: err
                        });
                    }
                    return res.redirect("/index");
                });
            }
        })(req, res, next);
    });

    rtr.get('/signup/facebook', passport.authenticate('facebook'));

    rtr.get("/auth/facebook/callback", function (req, res, next) {
        passport.authenticate("facebook", { 'scope': ['public_profile', 'email'] }, function (err, user, info) {
            if (err) {
                res.render("account/login.html", {
                    errormessage: err
                });
            }
            else if (user.exists) {
                res.render("account/login.html", {
                    errormessage: 'Email already exists'
                });
            }
            else {
                req.logIn(user.doc, function (err) {
                    if (err) {
                        res.render("account/login.html", {
                            errormessage: err
                        });
                    }
                    return res.redirect("/index");
                });
            }
        })(req, res, next);
    });
}

exports.RegisterAccount = RegisterAccountRoutes;