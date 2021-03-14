module.exports = function(localConfig) {

  // overwrite default config with local values
  var config = require("./config.json")
  if (localConfig) {
    Object.assign(config,localConfig);
  }

  this.start = function(localConfig) {

    // load modules
    const express      = require('express')
        , helmet       = require("helmet")
        , proxy        = require('express-http-proxy')
        , emu          = require('express-middleware-upload')
        , handlebars   = require("express-handlebars")
        , cookieParser = require('cookie-parser')
        , sharp        = require("sharp")
        , morgan       = require('morgan')
        , fs           = require('fs')
        , path         = require('path')
        , auth         = require("./auth")
        , session      = require("./session")
        , database     = require('./database')
        , renderer     = require("./renderer")
        ;

    console.log(`projectPath = ${config.projectPath}`);
    console.log(`starting cmjs server...`);

    var app = express();

    // helmet
    app.use(helmet({
      contentSecurityPolicy: false
    }));

    // parse cookie
    app.use(cookieParser());
    
    // Login page
    app.post("/api/login", express.json());
    app.post("/api/login", auth.login);

    // check authorization for API access
    app.use("/api", auth.protect);

    // database api
    app.use("/api/db", database.restApi);

    // set session in res.locals.session
    app.use(session.getByQueryParameter);
    app.use(session.getByCookie);

    // log
    // create a write stream (in append mode)
    var accessLogStream = fs.createWriteStream(config.express.log, { flags: 'a' })
    app.get(/^\/[^\/]*$/, morgan('combined', { stream: accessLogStream }));

    // serve static files of admin tool
    if (config.devMode) {
      app.use("/admin", express.static("./cmjs/admin"));
      app.use("/admin/resources", proxy("https://openui5.hana.ondemand.com/resources") );
    }
    else {
      app.use("/", express.static("./cmjs/dist"));
    }

    // serve public files of template
    app.use("/public", express.static(path.join(config.projectPath, "/template/public")));

    // serve public files of uploads
    app.use("/uploads", express.static(path.join(config.projectPath, "/uploads")));
    
    // api to maintain uploads
    app.use(path.join("/api/uploads", "/:path?"), emu({
      path: path.join(config.projectPath, "/uploads"),
      postProcessing: function(req, res, next) {
        // create thumbnails
        for(var file of req.files) {
          sharp(file.storagePath)
          .resize(170,170,{fit:"inside"})
          .toFile(file.storagePath.replace(/^(.*)\/([^\/]+)$/,"$1/thumbnails/$2"), function(err,info){});
        }
        next();
      }
    }));  
        
    // template engine
    const engine = handlebars({
      "defaultLayout":"default",
      "extname": ".hbs",
      "defaultLayout":"default"
    });
    app.engine(".hbs", engine);
    app.set('view engine', ".hbs");
    app.set("views", path.join(config.projectPath,"template")); 
    app.enable("view cache");
    app.get("/:id?", renderer);
    
    // express listens 
    const port = config.express.port || "8080";
    app.listen(port);
    console.log(`frontend running on http://localhost:${port}/`);
    console.log(`admin tool running on http://localhost:${port}/admin`);
  }
}
