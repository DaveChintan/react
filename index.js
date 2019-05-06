const http = require("http");
const https = require("https");
const express = require("express");
const passport = require("passport");
const session = require("express-session");
const bodyparser = require("body-parser");
const OIDCStrategy = require("passport-azure-ad").OIDCStrategy;
const BearerStrategy = require("passport-http-bearer").Strategy;
const path = require("path");
const mail = require("./routes/mail");
const auth = require("./routes/auth");
const fs = require("fs");
const graph = require("./graph");
const redis = require("redis");

const isProduction = process.env.NODE_ENV == "production";

if (!isProduction) require("dotenv").config();

const client = redis.createClient({
  port: 12736,
  host: "redis-12736.c74.us-east-1-4.ec2.cloud.redislabs.com"
  //password: process.env.redispassword,
  //db: "react",
  //auth_pass: process.env.redispassword
});
client.auth(process.env.redispassword, function(err, reply) {
  console.log(reply);
});

client.on("connect", () => {
  console.log("connect");
});

client.on("error", () => {
  console.log("error");
});

const app = express();

passport.serializeUser(function(user, done) {
  done(null, user.profile.oid);
});

passport.deserializeUser(function(oid, done) {
  findByOid(oid, function(err, user) {
    done(err, user);
  });
});

// Configure simple-oauth2
const oauth2 = require("simple-oauth2").create({
  client: {
    id: process.env.clientID,
    secret: process.env.clientSecret
  },
  auth: {
    revokePath: process.env.destroySessionUrl,
    tokenHost: process.env.OAUTH_AUTHORITY,
    authorizePath: process.env.OAUTH_AUTHORIZE_ENDPOINT,
    tokenPath: process.env.OAUTH_TOKEN_ENDPOINT
  }
});

// array to hold logged in users
var users = [];
var findByOid = function(oid, fn) {
  client.get(oid, (err, reply) => {
    if (err) {
      fn(err, null);
    } else {
      if (!reply) fn(null, null);
      else fn(null, reply);
    }
  });
  // for (var i = 0, len = users.length; i < len; i++) {
  //   var user = users[i];
  //   if (user.profile.oid === oid) {
  //     return fn(null, user);
  //   }
  // }
  // return fn(null, null);
};

passport.use(
  new OIDCStrategy(
    {
      identityMetadata: process.env.identityMetadata,
      clientID: process.env.clientID,
      responseType: process.env.responseType,
      responseMode: process.env.responseMode,
      redirectUrl: process.env.redirectUrl,
      allowHttpForRedirectUrl: process.env.allowHttpForRedirectUrl,
      clientSecret: process.env.clientSecret,
      validateIssuer: false,
      //tenantIdOrName : 'common',
      //isB2C: process.env.isB2C,
      //issuer: process.env.issuer,
      passReqToCallback: process.env.passReqToCallback,
      scope: process.env.scope,
      loggingLevel: process.env.loggingLevel,
      //nonceLifetime: process.env.nonceLifetime,
      //nonceMaxAmount: process.env.nonceMaxAmount,
      useCookieInsteadOfSession: process.env.useCookieInsteadOfSession
      //cookieEncryptionKeys: process.env.cookieEncryptionKeys,
      //clockSkew: process.env.clockSkew,
    },
    function(req, iss, sub, profile, accessToken, refreshToken, params, done) {
      if (!profile.oid) {
        return done(new Error("No oid found"), null);
      }
      // asynchronous verification, for effect...
      process.nextTick(function() {
        findByOid(profile.oid, async function(err, user) {
          if (err) {
            return done(err);
          }

          try {
            const user = await graph.getUserDetails(accessToken);

            if (user) {
              // Add properties to profile
              profile["email"] = user.mail ? user.mail : user.userPrincipalName;
            }
          } catch (err) {
            done(err, null);
          }

          // Create a simple-oauth2 token from raw tokens
          let oauthToken = oauth2.accessToken.create(params);
          // Save the profile and tokens in user storage
          users[profile.oid] = { profile, oauthToken };
          client.set(profile["email"], JSON.stringify({ profile, oauthToken }));
          client.set(profile.oid, JSON.stringify({ profile, oauthToken }));
          return done(null, users[profile.oid]);

          // if (!user) {
          //   // "Auto-registration"
          //   users.push(profile);
          //   return done(null, profile);
          // }
          // return done(null, user);
        });
      });
    }
  )
);

passport.use(
  new BearerStrategy(function(token, done) {
    return done(null, token, { scope: "read" });
  })
);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.use(express.static(path.join(__dirname, "public")));

app.use(bodyparser.json());
// app.use(express.urlencoded({ extended: false }));
app.use(bodyparser.urlencoded({ extended: true }));

app.use(
  session({
    resave: true,
    saveUninitialized: false,
    unset: "destroy",
    secret: "hello"
  })
);

app.use(passport.initialize());
app.use(passport.session());

var Handlebars = require("hbs");
Handlebars.registerHelper("json", context => JSON.stringify(context));

app.use(function(req, res, next) {
  // Set the authenticated user in the
  // template locals
  if (req.session && req.session.user) {
    res.locals.user = req.session.user.profile;
    res.locals.token = req.session.user.oauthToken.token.access_token;
    // req.session.destroy(err => {
    //   req.logout();
    //   next(err);
    // });
  }
  //else
  next();
});

app.get("/login", function(req, res, next) {
  passport.authenticate("azuread-openidconnect", {
    response: res,
    prompt: "login",
    failureRedirect: "/",
    failureFlash: true
  })(req, res, next);
});

app.post("/login", function(req, res, next) {
  const email = req.body.email;
  if (!email) res.redirect("/");
  else {
    client.get(email, function(err, reply) {
      if (err) {
        res.locals.err = err;
        res.render("index");
      } else if (!reply) {
        res.locals.err = "NOT FOUND";
        res.render("index");
      } else {
        const user = JSON.parse(reply);
        res.locals.user = user.profile;
        res.locals.token = user.oauthToken.token.access_token;
        res.render("index");
      }
    });
  }
});

app.get("/logout", function(req, res) {
  req.session.destroy(err => {
    req.logOut();
    res.redirect(process.env.destroySessionUrl);
  });
});

app.get("/", async function(req, res, next) {
  res.locals.name = "root";
  res.render("index");
  //res.writeHead(200, "Welcome", { "Content-Type": "text/html" });
  //res.write("Root");
  //res.end();
});

app.get("/index", async function(req, res, next) {
  res.locals.name = "index";
  res.render("index");
  // res.writeHead(200, "Welcome", { "Content-Type": "text/html" });
  // res.write("Index");
  // res.end();
});

app.use("/mail", mail);
app.use("/auth", auth);

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send({ error: "Something failed!" });
  } else {
    next(err);
  }
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  res.status(500);
  res.render("error", { error: err });
}

app.use(clientErrorHandler);
app.use(errorHandler);

function cleanup() {
  console.info("SIGTERM signal received.");
  if (client != null) {
    try {
      client.quit();
    } catch (e) {}
    process.exit(0);
  }
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// http
//   .createServer(function(req, res) {
//     res.writeHead(200, "Welcome", { "Content-Type": "text/html" });
//     res.write("Welcome");
//     res.end();
//   })
//   .listen(port);

var port = process.env.PORT || 3000;
if (!isProduction) {
  http.createServer(app).listen(port);
} else {
  http.createServer(app).listen(port);
}
