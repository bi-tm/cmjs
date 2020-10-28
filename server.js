const e = require('express');
var express  = require('express')
  , proxy    = require('express-http-proxy')
  , morgan   = require('morgan')
  , mustache = require('mustache-express')
  , config   = require("./config.json");

var app = express();

// log
app.use(morgan('combined'));

// static files of SAPUI5 frontend 
const statics = config.static || [];
for (var s of statics) {
  app.use(s.mountPath, express.static(__dirname + s.localPath));
}

// proxies, i.e. for couchDB
const proxies = config.proxy || [];
proxies.push(config.database);
for(var p of proxies) {
  app.use(p.mountPath, proxy(p.url));
}

// configure axios database access
var axios = require('axios').create({
  baseURL: config.database.url + "/pages/",
  auth: config.database.auth
});

// mustache
var engine = mustache(__dirname + config.mustache.localPath + "/partials", ".mst");
engine.cache
app.engine("mst", engine);
app.set("view engine", "mst");
app.set("views", __dirname + config.mustache.localPath);
app.get(config.mustache.mountPath + ":id", function(request,response) {
  // read page data via axios
  if (typeof(request.query.flush) !== "undefined" ) {
    engine.cache.reset();
  }
  axios.get(request.params.id)
  .then(dbResp => {
    // render mustache
    response.render(dbResp.data.pageType, dbResp.data, function(error,html) {
      if (error) {
        // mustache error
        console.error(error.message);
        response.status(500).end(error.message);
      }
      else {
        // ready
        response.send(html);
      }
    });
  })
  .catch(error => {
    // axios error
    if (error.response) {
      console.error(error.response.status);
      response.status(error.response.status).end(error.response.statusText);
    }
    else if (error.request) {
      console.error(error.request);
      response.status(500).end(error.request);
    }
    else {
      console.error(error.message);
    }
  });
});

// express listens 
const port = config.express.port || "8080";
app.listen(port);
console.log(`admin tool running on http://localhost:${port}/admin`);
