const http = require("http");

http
  .createServer(function(req, res) {
    res.writeHead(200, "Welcome", { "Content-Type": "text/html" });
    res.write("Welcome");
    res.end();
  })
  .listen(8080);
