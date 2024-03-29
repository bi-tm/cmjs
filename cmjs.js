const server = require("./cmjs/server")
    , path   = require('path')
    , fs     = require('fs-extra')
    ;

// optional project path from argument list or environment variable CMJS_PROJECT
var projectPath = null;
if (process.argv.length>2) {
    projectPath = path.resolve(process.argv[2]);
}
else if(process.env.CMJS_PROJECT) {
    projectPath = path.resolve(process.env.CMJS_PROJECT);
}
else {
    projectPath = path.resolve("./demo");
}

// check if project path exists, if not create it
if (!fs.existsSync(projectPath)) {
    const source = path.resolve("./demo");
    if (projectPath !== source)  {
        console.log(`initializing project ${projectPath} ...`);
        fs.copySync(source, projectPath);
    }
}

// check if there is a config file in project path
var projectConfig = null;
if (typeof(projectPath) === "string") {
    try {
        projectConfig = require(path.join(projectPath, "config.json"));
        projectConfig.projectPath = path.resolve(projectPath);
    }
    catch (err) {
        // it is okay, if there is no config file in project path
        projectConfig = { projectPath: projectPath };
    }
}

// start server
new server(projectConfig).start();
