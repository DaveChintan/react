var bluebird = require("bluebird");
var axios = require('axios')
var mdb = require("mongodb");
var http = require("http");
var express = require("express");
var nunjucks = require("nunjucks");
var app = express();
var path = require("path");
var fs = require("fs");
var moment = require("moment");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var session = require("express-session");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var FacebookStrategy = require("passport-facebook").Strategy;
var FacebookStrategy = require("passport-facebook").Strategy;
var GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
var RedisStore = require("connect-redis")(session);
var jwt = require('jsonwebtoken')
var MONGODATABSE = require("./db/mongo");
var REDISDATABSE = require("./db/redisdb");
var userfunc = require("./models/user");
var config = require("./config/config");
var mailer = require('nodemailer');
var sh = require('./helpers/sessionhelper');
var rl = require("redlock");
var morgan = require('morgan')
var compression = require('compression');
var favicon = require('serve-favicon');
var csrf = require('csurf');
var encrypt = require('./helpers/encrypthelper');
var winston = require('winston');
var adminRoute = require('./routes/admin')
var passportLocal = require('./routes/passportlocal')
var ps = require('./routes/passport');
var u = require('./routes/users');
var eh =  require('./helpers/emailhelper');
//var lg = require('./helpers/mongologger');
var acc = require('./routes/account')
var user = require('./routes/users')

Promise.all([MONGODATABSE.connectFunc(bluebird), REDISDATABSE(bluebird)])
  .then(response => {
    //console.log(response);
    // if (err) {
    //   console.log(err);
    // } else
    {
      console.log("connected");
      //var mongoClient = response[0][1];
      var mongoClient = response[0];
      var redisClient = response[1];
      //app.set('mongoose', response[0][0]);
      nunjucks.configure("views", {
        autoescape: true,
        express: app
      });
      app.set("mongoose", MONGODATABSE.database);
      var db = mongoClient;
      app.set("MONGODB", mongoClient);
      app.set("REDISDB", redisClient);
      var oLock = new rl([redisClient]);
      var sessionLock = sh(oLock);
      app.set('sessionlock', sessionLock);
      var USER = userfunc(MONGODATABSE.database);
      
      app.use(express.static("public"));
      app.use(favicon(path.join('public', 'images', 'icons', 'favicon.ico')));
      app.use(compression());
      app.use(cookieParser("heroku"));
      app.use(csrf({
        cookie: true, sessionKey: 'heroku', value: req => {
          var value = req.cookies['XSRF-TOKEN'];
          return value;
        }
      }));
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(bodyParser.json());
      var options = {
        ttl: 1200,
        client: response[1]
      };
      app.use(
        session({
          secret: "heroku",
          name: "Asp_NetSessionID",
          unset: "destroy",
          resave: false,
          saveUninitialized: false,
          store: new RedisStore(options)
        })
      );

      app.use(passport.initialize({}));
      app.use(passport.session());
      //ps.ConfigurePassport(passport, USER, lg, eh);
      ps.ConfigurePassport(passport, USER, null, eh);

      function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {

          return next();
        }
        else {
          if (req.xhr) {
            res.json(401, "UnAuthorized");
            res.end();
          } else {
            res.redirect("/");
          }
        }
      }

      app.options("/*", function (req, res, next) {
        var origin = req.headers['Origin'];
        origin = origin || '*';
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization, Content-Length, X-Requested-With, X-HTTP-Method-Override');
        res.send(200);
      });

      app.all("*", function (req, res, next) {
        var token = req.csrfToken();
        res.cookie('XSRF-TOKEN', token);
        res.locals.csrfToken = token;
        var url = req.protocol + "://" + req.get("host");
        if (!req.locals)
          req.locals = {};
        req.locals.root = url;
        res.locals.root = url;
        next(); // pass control to the next handler
      });

      app.get("/signup", function (req, res, next) {
        res.render("account/signup.html");
      });

      app.post("/signup", function (req, res, next) {
        var firstName = req.body.firstName;
        var lastName = req.body.lastName;
        var email = req.body.email;
        var password = req.body.password;
        USER.userExists({ email: email })
          .then(response => {
            if (response == 1)
              res.render("account/signup.html", {
                errormessage: "Email already exists."
              });
            else {
              var payload = {
                provider_id: "",
                provider_type: "local",
                firstName: firstName,
                displayName: "",
                lastName: lastName,
                role: "User",
                email: email,
                active: false,
                password: encrypt.encrypt(password),
                createdAt: new Date(),
                modifiedAt: new Date(),
                activationLink: req.param("root") + "/account/activate/",
                activationLinkExpired: false,
                activationLinkExpiredDate: moment()
                  .add(30, "days")
                  .format("MM/DD/YYYY")
              };
              var u = new USER(payload);
              (payload.activationLink =
                res.locals.root + "/account/activate/" + u._id.toString()),
                u.save(err => {
                  if (err)
                    res.render("account/signup.html", {
                      errormessage: err || "An error has been occurred."
                    });
                  else {
                    const transporter = mailer.createTransport({
                      host: 'smtp.gmail.com', // hostname
                      port: 465, // secure:true for port 465, secure:false for port 587
                      secure: true, // port for secure SMTP
                      auth: {
                        user: config.PROVIDERS.GOOGLE.USER_ID,
                        pass: config.PROVIDERS.GOOGLE.PASSWORD
                      }
                    });
                    // var transporter = mailer.createTransport({
                    //   debug: true,
                    //   host: 'smtp.sendgrid.net',
                    //   port: 465,
                    //   secure: true,
                    //   auth: {
                    //     user: 'apikey',
                    //     pass: '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'
                    //   }
                    // });

                    transporter.verify((error, success) => {
                      if (error) {
                        //transporter.close();
                        res.render("account/signup.html", {
                          errormessage: error
                        });
                      } else {
                        // if (error) {
                        //   res.render("account/signup.html", {
                        //     errormessage: 'CREATED'
                        //   });
                        // }
                      }
                    });
                    transporter.on('token', token => {
                      console.log('A new access token was generated');
                      console.log('User: %s', token.user);
                      console.log('Access Token: %s', token.accessToken);
                      console.log('Expires: %s', new Date(token.expires));
                    });
                    transporter.sendMail({
                      from: "cndave84@gmail.com", to: u.email, subject: 'Account Verification',
                      html: `<a href=${payload.activationLink}>Click here to activate</a>`
                    }).then(value => {
                      transporter.close();
                      console.log(value);
                      res.render("account/signup.html", {
                        errormessage: "created"
                      });
                    }).catch(err => {
                      transporter.close();
                      res.render("account/signup.html", {
                        errormessage: err || "An error has been occurred."
                      });
                    });

                  }
                });
            }
          })
          .catch(err => {
            res.render("account/signup.html", {
              errormessage: err || "An error has been occurred."
            });
          });
      });

      // app.get('/signup/facebook', passport.authenticate('facebook'));
      
      // app.get("/signup/google", passport.authenticate("google"));

      app.get("/account/activate/:id", function (req, res, next) {
        var id = req.param("id");
        USER.findOne({ _id: id })
          .then(doc => {
            if (!doc) {
              res.json("Invalid link");
              res.end();
            } else {
              if (doc.activationLinkExpired) {
                res.json("Link expired");
                res.end();
              } else {
                var expdate = moment(
                  doc.activationLinkExpiredDate,
                  "MM/DD/YYYY"
                );
                var diff = expdate.diff(moment(), "days", true);
                if (diff <= 0) {
                  res.json("Link expired");
                  res.end();
                } else {
                  res.render('account/activate.html', { token: res.locals.csrfToken, email: doc.email })
                }
              }
            }
          })
          .catch(err => {
            res.json(error);
            res.end();
          });
      });

      app.post("/account/activate/:id", function (req, res, next) {
        var id = req.param("id");
        var email = req.body.email;
        var password = req.body.password;

        if (!email || !password) {
          res.render("account/activate.html", { token: res.locals.csrfToken, email: email || '' });
          return;
        }

        USER.findOne({ _id: id })
          .then(doc => {
            if (!doc) {
              res.render("account/activate.html", { token: res.locals.csrfToken, email: email || '', errorMessage: 'Acctivation failed' });
              return;
            }
            if (doc.activationLinkExpired || doc.active) {
              res.render("account/activate.html", { token: res.locals.csrfToken, email: email || '', errorMessage: 'Acctivation failed' });
              return;
            } else {
              var expdate = moment(
                doc.activationLinkExpiredDate,
                "MM/DD/YYYY"
              );
              var diff = expdate.diff(moment(), "days", true);
              if (diff <= 0) {
                res.render("account/activate.html", { token: res.locals.csrfToken, email: email || '', errorMessage: 'Acctivation failed' });
                return;
              }
              else {
                req.logIn(doc, err => {
                  doc.modifiedAt = new Date();
                  doc.modifiedAt = new Date();
                  doc.activationLinkExpired = true;
                  doc.active = true;
                  doc
                    .save()
                    .then(_ => {
                      res.redirect('admin/users.html');
                      res.end();
                    })
                    .catch(err => {
                      res.render("account/activate.html", { token: res.locals.csrfToken, email: email || '', errorMessage: 'Acctivation failed' });
                      return;
                    });
                });
              }
            }
          })
          .catch(err => {
            res.render("account/activate.html", { token: res.locals.csrfToken, email: email || '', errorMessage: 'Acctivation failed' });
            return;
          });
      });

      //register user account routes
      var _userRouter = express.Router();
      //var userRoute = user.Users(db, logger);
      var userRoute = user.Users(db, null);
      //acc.RegisterAccount(_userRouter, db, logger, passport);
      acc.RegisterAccount(_userRouter, db, null, passport);
      app.use('/account', _userRouter);

      //register admin routes
      var _aRoute = express.Router();
      //adminRoute.Admin(db, logger, _aRoute)
      adminRoute.Admin(db, null, _aRoute, userRoute);
      app.use('/admin', _aRoute);

      app.post("/logout", function (req, res, next) {
        req.session.destroy();
        req.session.logout();
        res.redirect("/");
      });

      app.get("/download", (req, res) => {
        let filePath = path.join(__dirname, "tsconfig.json");
        res.attachment("hello.json");
        res.end();
      });

      app.get('/users', function (req, res, next) {
        USER.GetAll().then(users => {
          res.render('admin/users.html', { users: users })
        }).catch(err => {
          res.sendStatus(200)
        });
      });

      app.use(function (err, req, res, next) {
        if (res.headersSent) {
          return next(err);
        }
        else {
          res.status(500)
          res.render('error', { error: err })
        }
      });

      var port = process.env.PORT || 8080;

      var server = http.createServer(app);

      // var server = http.createServer((request, response) => {
      //     console.log('received');
      //     response.writeHead(200, 'OK', { 'Content-Type': 'text/html' });
      //     response.write('HELLO');
      //     response.end();
      // });
      process.on("SIGNINT", function () {
        console.log("closing");
        client.close();
        console.log("closed");
      });
      server.listen(port);
    }
  })
  .catch(reason => console.log(reason));

//let url = `mongodb+srv://chintan:DTTCltZjO9TkBFn5@herokucluster-4remq.mongodb.net/test`;

//mdb.MongoClient.connect(url, (err, client) => {});

console.log("started");
