var server = require("./cmjs/server");
var config = require("./config.json");
config.root = __dirname;
server.start(config);
