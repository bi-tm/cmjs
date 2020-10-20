const { static } = require('express');
var express = require('express')
  , proxy   = require('express-http-proxy')
  , morgan  = require('morgan')
  , config  = require("./config.json");

var app = express();

// log
app.use(morgan('combined'));

// static files of SAPUI5 frontend 
const statics = config.static || [];
for (var path of statics) {
  app.use(express.static(__dirname + path));
}

// proxies, i.e. for couchDB
const proxies = config.proxy || [];
for(var p of proxies) {
  app.use(p.mountPath, proxy(p.url));
}

// express listens 
const port = config.express.port || "8080";
app.listen(port);
console.log(`admin tool runnun on http://localhost:${port}`);
