const express    = require('express')
    , proxy      = require('express-http-proxy')
    , emu        = require('express-middleware-upload')
    , morgan     = require('morgan')
    , fs         = require('fs')
    , path       = require('path')
    , database   = require('./database')
    , renderer   = require("./renderer")
    ;

module.exports = {
  start: function(config) {
    var app = express();
    
    // init database
    database.init(config);
    app.use(config.nedb.mountPath, database.restApi);

    // log
    // create a write stream (in append mode)
    var accessLogStream = fs.createWriteStream(path.join(config.root, 'access.log'), { flags: 'a' })
    app.use(morgan('combined', { stream: accessLogStream }));
    
    // static files (.i. SAPUI5 frontend, public images, ...)
    const statics = config.static || [];
    for (var s of statics) {
      app.use(s.mountPath, express.static(config.root + s.localPath));
    }
    
    // uploads
    const uploads = config.uploads || [];
    for(var u of uploads) {
      app.use(u.mountPath + "/:path?", emu({
        path: config.root + u.localPath,
        postProcess: function(req, res) {
          debugger;
        }
      }));  
    }
    
    // proxies
    const proxies = config.proxy || [];
    for(var p of proxies) {
      app.use(p.mountPath, proxy(p.url));
    }
    
    // template engine
    const engine = require(config.engine.module)(config.engine.config);
    app.engine(config.engine.config.extname, engine);
    app.set('view engine', config.engine.config.extname);
    app.set("views", config.engine.config.viewDir); 
    app.enable("view cache");
    app.get(config.engine.mountPath + ":id?", renderer);
    
    // express listens 
    const port = config.express.port || "8080";
    app.listen(port);
    console.log(`frontend running on http://localhost:${port}/`);
    console.log(`admin tool running on http://localhost:${port}/admin`);
  }
}
