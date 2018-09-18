var auth = require('../helpers/authhelper');
var express = require('express');
var app = require('express')();


function Users(db, logger) {
    return {
        'Users': function (req, res, next) {
            db.User.GetActive().then(data => res.render('/admin/users.html', { users: data }));
        },
        'GetById': function (req, res, next) {
            var id = req.param('user_id');
            db.User.GetActive({ _id: id }).then(data => res.render('/admin/user.html', { user: data }));
        },
        'SignInGet': function (req, res, next) {
        },
        'SignInPost': function (req, res, next) {
        },
        'LoginCallback': function (err, user, info) {
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
        },
        "GoogleCallback": function (err, user, info) {
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
        },
        "FacebookCallback": function (err, user, info) { 
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
        }
    }
}

exports.Users = Users