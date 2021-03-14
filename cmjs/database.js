var nedb     = require("nedb")
  , path     = require('path')
  , nedbRest = require('express-nedb-rest')
  , hash     = require('./hash')
  , config   = require('./config.json')
  ;

var database = { };

// initialize datastores
database.restApi= nedbRest();

const dbPath = path.join(config.projectPath, "nedb");

database.pages = new nedb({filename: path.join(dbPath, 'pages.db'), autoload:true});
database.pages.ensureIndex({ "fieldName": "parentId"});
database.restApi.addDatastore("pages", database.pages);  

database.page_types = new nedb({filename: path.join(dbPath, 'page_types.db'), autoload:true});
database.restApi.addDatastore("page_types", database.page_types);  

database.sites = new nedb({filename: path.join(dbPath, 'sites.db'), autoload:true});
database.restApi.addDatastore("sites", database.sites);  

database.users = new nedb({filename: path.join(dbPath, 'users.db'), autoload:true});
database.restApi.addDatastore("users", database.users);  

// init
// hash password in users collection via validator function
database.restApi.setValidator(function(req,res,next) {
    if (req.collection && req.collection === "users" && ( req.method == 'POST' || req.method == 'PUT' )) {
        if (req.body.password && req.body.password !== "") {
            req.body.hash = hash(req.body.password);
            req.body.password = undefined;
        }
    }
});

/**
 * get NEDB datastore.
 * new datastore is created, if it not exists
 * @param {string} name 
 */
database.get= function(name) {
    var result = this[name];
    if (!result) {
        result = new nedb({filename: path.join(dbPath, `${name}.db`), autoload:true});
        this[name] = result;
    }
    return result;
},

/**
 * query pages
 * @param {*} selector 
 * @param {*} projection 
 * @param {*} sort 
 * @param {*} limit 
 * @returns {Promise}
 */
database.findPages= function(selector, projection, sort, limit) {
    return new Promise(function(resolve, reject) {
        var cursor = this.pages.find(selector);
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
    }.bind(this));
};

/**
 * reads a single page
 * @param {string} _id 
 * @param {NeDB Projection} projection 
 * @returns {Promise}
 */
database.getPage= function(_id, projection) {
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
    }.bind(this));
};

/**
 * reads children of a parent page 
 * @param {*} _id 
 * @param {*} projection 
 */
database.getChildren= function (_id, projection) {
    if (typeof(_id) === "undefined") {
        var _id = null;
    }
    return database.findPages({parentId: _id, published: true }, projection, {sort:1});
};

module.exports = database;