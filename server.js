var express = require('express');
var proxy = require('express-http-proxy');
const port = 8080;
//const basePath = '/admin';
const basePath = '';

var app = express();
var morgan = require('morgan');
app.use(morgan('combined'));
app.use(basePath, express.static(__dirname + '/dist'));
app.use(basePath + '/api', proxy('https://couchdb.feste-feiern-in-bielefeld.de', { proxyReqPathResolver: req => req.url.replace(basePath, '') }));
app.listen(port);
console.log('admin tool runnun on http://localhost:' +  port + basePath);