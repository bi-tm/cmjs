const { nextTick } = require("process");
const path = require("path");

var config = require("./config.json");

async function determineSite(request, response, next) {
  try {
    const database = require("./database");
    const host = request.headers.host.split(":", 1)[0];
    const site = await database.getSite(host);
    response.locals.site = site;
    next();
  } catch (err) {
    response.status(500).end(err);
  }
}

async function redirectToRoot(request, response) {
  // redirect to root page
  try {
    var database = require("./database");
    var docs = await database.findPages(
      { parentId: null, siteId: response.locals.site._id, showInMenu: true, published: true },
      ["_id"],
      { sort: 1 },
      1
    );
    if (docs.length) {
      response.redirect("/" + docs[0]._id);
    } else {
      response.status(404).end("no root page found");
    }
  } catch (err) {
    response.status(500).end(err);
  }
}

function redirectToShortUrl(request, response) {
  response.redirect("/" + request.params.id);
}

function cacheSwitch(request, response, next) {
  response.locals.cache =
    typeof (request.query.refresh) === "undefined" && !config.devMode;
  next();
}

module.exports = function (projectConfig) {
  if (projectConfig) {
    Object.assign(config, projectConfig);
  }
  console.log("configuration", JSON.stringify(config));

  this.start = function () {
    // load modules
    const express = require("express"),
      helmet = require("helmet"),
      proxy = require("express-http-proxy"),
      handlebars = require("express-handlebars"),
      cookieParser = require("cookie-parser"),
      morgan = require("morgan"),
      fs = require("fs-extra"),
      auth = require("./auth"),
      session = require("./session"),
      database = require("./database"),
      dataloader = require("./dataloader"),
      renderer = require("./renderer"),
      uploads = require("./uploads");

    console.log(`projectPath = ${config.projectPath}`);
    console.log(`starting cmjs server...`);

    var app = express();

    // helmet
    app.use(
      helmet({
        contentSecurityPolicy: false,
      })
    );

    // parse cookie
    app.use(cookieParser());

    // Login page
    app.post("/api/login", express.json());
    app.post("/api/login", auth.login);

    // check authorization for API access
    app.use("/api", auth.protect);

    // database api
    app.use("/api/db", database.restApi);

    // api to maintain uploads
    app.use("/api/uploads/:path?", uploads);

    // serve static files of admin tool
    app.use(
      "/admin/resources",
      proxy("https://openui5.hana.ondemand.com/resources")
    );
    app.use("/admin", express.static("./cmjs/admin"));

    // set session in res.locals.session
    app.use(session.getByCookie);
    if (config.session === "queryParameter") {
      app.use(session.getByQueryParameter);
      session.enableQueryParameter();
    }

    // log
    // create a write stream (in append mode)
    if (config.log) {
      var accessLogStream = fs.createWriteStream(config.log, { flags: "a" });
      app.get(/^\/[^\/]*$/, morgan("combined", { stream: accessLogStream }));
    }

    // serve static files of admin tool
    // if (config.devMode) {
    // app.use("/admin", express.static("./cmjs/admin"));
    // app.use(
    //   "/admin/resources",
    //   proxy("https://openui5.hana.ondemand.com/resources")
    // );
    // } else {
    //     if (!fs.existsSync("./dist")) {
    //         // ui5 build
    //         console.log("building ui5 admin tool ...")
    //         var { spawn } = require('child_process');
    //         var process = spawn("npx", ["ui5", "build", "self-contained", "--all"]);
    //         process.on("exit", (code) => {
    //             console.log(`build process exited with code ${code}`);
    //         });
    //     }
    //     app.use("/admin", express.static("./dist"));
    // }

    // serve public files of template
    app.use(
      "/public",
      express.static(path.join(config.projectPath, "/template/public"))
    );

    // serve public files of uploads
    app.use(
      "/uploads",
      express.static(path.join(config.projectPath, "/uploads"))
    );

    // template engine
    const engine = handlebars.engine({
      defaultLayout: "default",
      partialsDir: path.join(config.projectPath, "template", "partials"),
      extname: ".hbs",
    });
    app.engine(".hbs", engine);
    app.set("view engine", ".hbs");
    if (config.devMode) {
      app.disable("view cache");
    } else {
      app.enable("view cache");
    }

    app.get(["/", "/index.html", "/index.htm", "/index.php"], determineSite, redirectToRoot);
    app.get("/*/:id", redirectToShortUrl);
    app.get("/:id", cacheSwitch, determineSite, dataloader, renderer);

    // express listens
    const port = config.port || "8080";
    app.listen(port);
    console.log(`frontend running on http://localhost:${port}/`);
    console.log(`admin tool running on http://localhost:${port}/admin`);
  };
};
