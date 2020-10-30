const express  = require('express')
    , proxy    = require('express-http-proxy')
    , morgan   = require('morgan')
    , mustache = require('mustache-express')
    , config   = require("./config.json")
    , { pouchDB, database } = require("./cmjs/database")
    , renderer = require("./cmjs/renderer")
    ;

var app = express();

// log
app.use(morgan('combined'));

// static files (.i. SAPUI5 frontend, public images, ...)
const statics = config.static || [];
for (var s of statics) {
  app.use(s.mountPath, express.static(__dirname + s.localPath));
}

// proxies
const proxies = config.proxy || [];
for(var p of proxies) {
  app.use(p.mountPath, proxy(p.url));
}

// mustache
const engine = mustache(__dirname + config.mustache.localPath + "/partials", ".mst");
app.engine("mst", engine);
app.set("view engine", "mst");
app.set("views", __dirname + config.mustache.localPath);
app.get(config.mustache.mountPath + ":id", renderer);

// express listens 
const port = config.express.port || "8080";
app.listen(port);
console.log(`admin tool running on http://localhost:${port}/admin`);
