var bluebird = require("bluebird");
//global.Promise = bluebird;
//require("@babel/runtime/core-js/promise").default = require("bluebird");
var mdb = require("mongodb");
//import { MongoClient, Db } from 'mongodb'
var http = require("http");
var express = require("express");
var nunjucks = require('nunjucks')
var app = express();
var path = require("path");
var fs = require("fs");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var session = require("express-session");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var RedisStore = require("connect-redis")(session);

var MONGODATABSE = require("./src/db/mongo");
var REDISDATABSE = require("./src/db/redisdb");
var userfunc = require('./src/models/user');
var config = require('./src/config/config')
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
      nunjucks.configure('views', {
        autoescape: true,
        express: app
      });
      app.set('mongoose', MONGODATABSE.database);
      app.set("MONGODB", mongoClient);
      app.set("REDISDB", redisClient);
      var USER = userfunc(MONGODATABSE.database);
      app.use(express.static("public"));
      app.use(cookieParser("heroku"));
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

      passport.use(new LocalStrategy(function (username, password, done) {

        let user = undefined;
        if (username == 'admin' && password == 'admin') {
          user = { 'id': 1, name: 'chintan' };
        }
        if (!user) {
          USER.findOne({ email: username }).then((err, doc) => {
            if (err) {
              console.log(err);
              return done(null, false, { message: 'Invalid credentials' });
            }
            else if (!doc) {
              return done(null, false, { message: 'Invalid credentials' });
            }
            else
              return done(null, doc);
          });
        } else {
          return done(null, user);
        }
      }));

      passport.use(new FacebookStrategy({
        clientID: config.PROVIDERS.FACEBOOK.CLIENT_ID,
        clientSecret: config.PROVIDERS.FACEBOOK.CLIENT_SECRET,
        callbackURL: config.PROVIDERS.FACEBOOK.REDIRECT_URL,
        profileFields: ['id', 'displayName', 'emails',
          'photos', 'gender', 'link', 'locale', 'name',
          'timezone', 'updated_time', 'verified'],
        passReqToCallback: true,
        enableProof: true
      },
        function (req, accessToken, refreshToken, profile, done) {
          console.log(accessToken);
          console.log(refreshToken);
          console.log(profile);
          done(null, profile);
          // User.findOrCreate(..., function (err, user) {
          //   if (err) { return done(err); }
          //   done(null, user);
          // });
        }
      ));

      passport.use(new GoogleStrategy({
        clientID: config.PROVIDERS.GOOGLE.CLIENT_ID,
        clientSecret: config.PROVIDERS.GOOGLE.CLIENT_SECRET,
        callbackURL: config.PROVIDERS.GOOGLE.REDIRECT_URL,
        'scope': ['openid', 'profile', 'email', 'https://www.googleapis.com/auth/plus.profile.emails.read']
      },
        function (accessToken, refreshToken, profile, done) {
          User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return done(err, user);
          });
        }
      ));



      // app.use(cookieParser('chintan'));
      // app.use(session({ secret: 'chintan', name: 'Asp_NetSessionID', unset: 'destroy' }));
      // app.use(bodyParser());

      //let db = client.db("test");

      function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated())
          return next();
        else {
          if (req.xhr) {
            res.json(401, 'UnAuthorized');
            res.end();
          }
          else {
            res.redirect('/');
          }
        }
        // Return error content: res.jsonp(...) or redirect: res.redirect('/login')
      }

      app.all("/secret", ensureAuthenticated, function (req, res, next) {
        console.log("Accessing the secret section ...");
        next(); // pass control to the next handler
      });

      app.get('/signup', function (req, res, next) {
        res.render('account/signup.html');
      });

      app.post('/signup', function (req, res, next) {
        var firstName = req.body.firstName;
        var lastName = req.body.lastName;
        var email = req.body.email;
        var password= req.body.assword;
        res.render('account/signup.html');
      });

      app.get('/signup/facebook', passport.authenticate('facebook'));

      app.get('/auth/facebook/callback', function (req, res, next) {
        passport.authenticate('facebook', { authType: 'rerequest', 'scope': ['email'] }, function (err, user, info) {
          if (err) { return next(err); }
          if (!user) { return res.redirect('/'); }
          req.logIn(user, function (err) {
            if (err) { return next(err); }
            return res.redirect('/index');
          });
        })(req, res, next);
      });

      app.get('/signup/google', passport.authenticate('google'));

      app.get('/auth/google/callback', function (req, res, next) {
        passport.authenticate('google', function (err, user, info) {
          if (err) { return next(err); }
          if (!user) { return res.redirect('/'); }
          req.logIn(user, function (err) {
            if (err) { return next(err); }
            return res.redirect('/index');
          });
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
          var errormessage = ""
          response.render('login.html', { errormessage: errormessage, email: '', password: '' });
          // fs.readFile(filePath, (err, data) => {
          //   response.writeHead(200, "OK", { "Content-Type": "text/html" });
          //   response.write(data);
          //   response.end();
          // });
        }
      });

      app.post('/login', function (req, res, next) {
        passport.authenticate('local', function (err, user, info) {
          if (err) { return next(err); }
          if (!user) {
            var errormessage = 'invalid credentials';
            // return res.redirect('/'); 
            return res.render('login.html', { errormessage: errormessage });
          }
          req.logIn(user, function (err) {
            if (err) { return next(err); }
            return res.redirect('/index');
          });
        })(req, res, next);
      });

      app.post('/logout', function (req, res, next) {
        req.session.destroy();
        req.session.logout();
        res.redirect('/');
      });

      // app.get("/collections", async (req, res, next) => {
      //   try {
      //     let collection = await db.createCollection("users", { w: 1 });
      //     await collection.insert({ id: 1 });
      //     //res.json(await db.listCollections());
      //     let response = await db.collections();
      //     let cs = [];
      //     response.forEach(r => {
      //       console.log(r.collectionName);
      //       cs.push(r.collectionName);
      //     });
      //     //let cursor = response[0].findOne();
      //     //let count = await cursor.count()
      //     //cursor.forEach(c => c);
      //     //cursor.close();
      //     res.json(cs);
      //   } catch (error) {
      //     next(error);
      //   }
      // });

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
