var bluebird = require("bluebird");
var axios = require('axios')
//global.Promise = bluebird;
//require("@babel/runtime/core-js/promise").default = require("bluebird");
var mdb = require("mongodb");
//import { MongoClient, Db } from 'mongodb'
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
var MONGODATABSE = require("./src/db/mongo");
var REDISDATABSE = require("./src/db/redisdb");
var userfunc = require("./src/models/user");
var config = require("./src/config/config");
var mailer = require('nodemailer');
var sh = require('./src/helpers/sessionhelper');
var rl = require("redlock");
var compression = require('compression');
var favicon = require('serve-favicon');
var csrf = require('csurf');

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
      app.set("MONGODB", mongoClient);
      app.set("REDISDB", redisClient);
      var oLock = new rl([redisClient]);
      var sessionLock = sh(oLock);
      app.set('sessionlock', sessionLock);
      var USER = userfunc(MONGODATABSE.database);
      app.use(express.static("public"));
      app.use(favicon(path.join(__dirname, 'public', 'images', 'icons', 'favicon.ico')));
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

      passport.serializeUser(function (user, done) {
        done(null, user);
      });
      passport.deserializeUser(function (user, done) {
        done(null, user);
      });

      passport.use(
        new LocalStrategy(function (username, password, done) {
          let user = undefined;
          if (username == "admin" && password == "admin") {
            user = { id: 1, name: "chintan" };
          }
          if (!user) {
            USER.findOne({ email: username }).then((doc, err) => {
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
        })
      );

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
            console.log(accessToken);
            console.log(refreshToken);
            console.log(profile);
            done(null, profile);
          }).catch(hellofb => {
            console.log(accessToken);
            console.log(refreshToken);
            console.log(profile);
            done(null, profile);
          });

          // User.findOrCreate(..., function (err, user) {
          //   if (err) { return done(err); }
          //   done(null, user);
          // });
        }
      ));

      passport.use(
        new GoogleStrategy(
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
                        const transporter = mailer.createTransport({
                          host: 'smtp.gmail.com', // hostname
                          port: 465, // secure:true for port 465, secure:false for port 587
                          secure: true, // port for secure SMTP
                          auth: {
                            user: config.PROVIDERS.GOOGLE.USER_ID,
                            pass: config.PROVIDERS.GOOGLE.PASSWORD
                          }
                        });
                        transporter.verify((error, success) => {
                          if (error) {
                            done(error, null);
                          }
                        });
                        transporter.sendMail({
                          from: "cndave84@gmail.com", to: strEmail, subject: 'Account Verification',
                          html: `<a href=${payload.activationLink}>Click here to activate</a>`
                        }).then(value => {
                          transporter.close();
                          console.log(value);
                          done(null, { exists: false, doc: u });
                        }).catch(err => {
                          transporter.close();
                          done(err, null);
                        });
                      }
                    });
                }
              });
            }
          }
        )
      )

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

      app.all("*", function (req, res, next) {

        var token = req.csrfToken();
        res.cookie('XSRF-TOKEN', token);
        res.locals.csrfToken = token;
        

        // var ssid = req.sessionID;
        // var lock = req.app.get('sessionlock');
        // lock.Get(req, ssid).then(hello => {
        //   console.log(hello);
        //   if (!hello)
        //     lock.Set(req, ssid, ssid);
        // }).catch(err => {
        //   console.log(err);
        // });

        // console.log("Accessing the secret section ...");
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
        var password = req.body.assword;
        USER.userExists({ email: email })
          .then(response => {
            if (response == 1)
              res.render("account/signup.html", {
                errormessage: "Email already exists."
              });
            else {
              var payload = {
                provider_id: "",
                provider_type: "",
                firstName: firstName,
                displayName: "",
                lastName: lastName,
                role: "User",
                email: email,
                active: false,
                password: password,
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

      app.get('/signup/facebook', passport.authenticate('facebook'));

      app.get('/auth/facebook/callback', function (req, res, next) {
        passport.authenticate('facebook', { 'scope': ['public_profile', 'email'] }, function (err, user, info) {
          if (err) { return next(err); }
          if (!user) { return res.redirect('/'); }
          req.logIn(user, function (err) {
            if (err) { return next(err); }
            return res.redirect('/index');
          });
        })(req, res, next);
      });

      app.get("/signup/google", passport.authenticate("google"));

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
                  req.logIn(doc, err => {
                    doc.modifiedAt = new Date();
                    doc.modifiedAt = new Date();
                    doc.activationLinkExpired = true;
                    doc.active = true;
                    doc
                      .save()
                      .then(_ => {
                        res.json("Success");
                        res.end();
                      })
                      .catch(err => {
                        res.json(err);
                        res.end();
                      });
                  });
                }
              }
            }
          })
          .catch(err => {
            res.json(error);
            res.end();
          });
      });

      app.get("/auth/google/callback", function (req, res, next) {
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

      app.get("/", function (request, response) {
        // if (request.isAuthenticated()) {
        //   response.redirect('/');
        // }
        //else
        {
          //var client = app.get("REDISDB");
          //client.set("HELLO", "HELLO");
          let session = request.session;
          let filePath = path.join(__dirname, "login.html");
          var errormessage = "";
          response.render("account/login.html", {
            errormessage: errormessage,
            email: "",
            password: ""
          });
          // fs.readFile(filePath, (err, data) => {
          //   response.writeHead(200, "OK", { "Content-Type": "text/html" });
          //   response.write(data);
          //   response.end();
          // });
        }
      });

      app.post("/login", function (req, res, next) {
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
            return res.redirect("/index");
          });
        })(req, res, next);
      });

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
