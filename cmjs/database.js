var nedb = require("nedb")
  , path = require('path')
  ;
  
var database = {
    init: function(config) {
        var result = {};

        for(var db of config.nedb.databases) {
            // create db
            const param ={filename: path.join(config.root, config.nedb.path, `${db}.db`)};
            this[db] = new nedb(param);
            this[db].loadDatabase(function(err) {
                console.log(`database loaded`);
            });            
        }
        // index 
        for(var db in config.nedb.index) {
            for (var index of config.nedb.index[db]) {
                this[db].ensureIndex(index);
            }
        }

        return result;                
    }
};

module.exports = database;