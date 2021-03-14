const path   = require("path");
const server = require("./cmjs/server");

var localConfig = null;
try {
    localConfig = require("./config.json");
}
catch (err) {
    localConfig = { };
}
if (process.argv.length>2) {
    localConfig.projectPath = process.argv[2];
}

const myServer = new server(localConfig);
myServer.start(localConfig);
