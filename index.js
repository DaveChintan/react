const http = require("http");
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const bodyparser = require('body-parser');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const path = require('path');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.json());
app.use(bodyparser.json());
// app.use(express.urlencoded({ extended: false }));
app.use(bodyparser.urlencoded({ extended: true }));

app.use(session({
  resave: true,
  saveUninitialized: false,
  unset: 'destroy',
  secret: "hello",
}));

app.use(passport.initialize());
app.use(passport.session());

var Handlebars = require('hbs');
Handlebars.registerHelper('json', (context) => JSON.stringify(context));

app.get('/', async function(req,res,next) {
    res.locals.name = 'root';
    res.render('index', {name: JSON.stringify(process.env)});
    //res.writeHead(200, "Welcome", { "Content-Type": "text/html" });
    //res.write("Root");
    //res.end();
});

app.get('/index', async function(req,res,next) {
  res.locals.name = 'index';
  res.render('index', {name: JSON.stringify(process.env)});
  // res.writeHead(200, "Welcome", { "Content-Type": "text/html" });
  // res.write("Index");
  // res.end();
});

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send({ error: 'Something failed!' });
  } else {
    next(err);
  }
}

function errorHandler (err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  res.status(500);
  res.render('error', { error: err });
}

app.use(clientErrorHandler);
app.use(errorHandler);

// http
//   .createServer(function(req, res) {
//     res.writeHead(200, "Welcome", { "Content-Type": "text/html" });
//     res.write("Welcome");
//     res.end();
//   })
//   .listen(port);

var port = process.env.PORT || 8080;
http.createServer(app)
  .listen(port);
