var auth = require('../helpers/authhelper');
//var express = require('express');
//var app = require('express')();


function RegisterAdmin(db, logger, router, userRoute) {
    //var userRoute = user.Users(db, logger);
    router.use(auth.authenticate);
    router.get('/users', userRoute.Users);
    router.get('/user/:user_id', userRoute.GetById);
}

exports.Admin = RegisterAdmin;