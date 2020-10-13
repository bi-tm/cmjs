var express = require('express');
var proxy = require('express-http-proxy');
const port = 8000;

var app = express();
var morgan = require('morgan');
app.use(morgan('combined'));
app.use('/api', proxy('https://couchdb.feste-feiern-in-bielefeld.de'));
app.use('/admin', express.static(__dirname + '/dist'));
app.listen(port);
console.log('admin tool runnun on http://localhost:' +  port + '/admin');