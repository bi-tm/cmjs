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
    },

    findPages: function(selector, projection, sort, limit) {
        return new Promise(function(resolve, reject) {
            var cursor = database.pages.find(selector);
            if(projection) {
                cursor = cursor.projection(projection);
            }
            if(sort) {
                cursor = cursor.sort(sort);
            }
            if(limit) {
                cursor = cursor.limit(limit);
            }
            cursor.exec(function(err,docs){
                if(err) {
                    reject(err);
                }
                else {
                    resolve(docs);
                }
            });
        });
    },

    getPage: function(_id, projection) {
        return new Promise(function(resolve, reject) {
            var cursor = database.pages.findOne({_id:_id});
            if(projection) {
                cursor = cursor.projection(projection);
            }
            cursor.exec(function(err,doc){
                if(err) {
                    reject(err);
                }
                else {
                    resolve(doc);
                }
            });
        });
    }

};

module.exports = database;