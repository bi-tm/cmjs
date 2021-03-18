const server = require("./cmjs/server")
    , path   = require('path')
    , fs     = require('fs-extra')
    ;

// optional project path from argument list or environment variable CMJS_PROJECT
var projectPath = null;
if (process.argv.length>2) {
    projectPath = process.argv[2];
}
else {
    projectPath = process.env.CMJS_PROJECT
}

// check if project path exists


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

    // init project if it is empty
    if (!fs.existsSync(projectPath)) {
        console.log(`initializing project ${projectPath} ...`);
        fs.copySync("./project",projectPath);
    };
}

const myServer = new server(projectConfig);
myServer.start();
