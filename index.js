const http = require("http");

var port = process.env.PORT || 8080;

http
  .createServer(function(req, res) {
    res.writeHead(200, "Welcome", { "Content-Type": "text/html" });
    res.write("Welcome");
    res.end();
  })
  .listen(port);
