const http = require("http");
const express = require('express');

const app = express();

var port = process.env.PORT || 8080;

app.get('/', async function(req,res,next) {
    res.writeHead(200, "Welcome", { "Content-Type": "text/html" });
    res.write("Root");
    res.end();
});

app.get('/index', async function(req,res,next) {
  res.writeHead(200, "Welcome", { "Content-Type": "text/html" });
  res.write("Index");
  res.end();
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

http.createServer(app)
  .listen(port);
