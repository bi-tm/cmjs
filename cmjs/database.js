var nedb     = require("nedb")
  , path     = require('path')
  , nedbRest = require('express-nedb-rest')
  , hash     = require('./hash')
  , config   = require('./config.json')
  ;
  
class database {

    #dbPath = path.join(config.projectPath, "nedb");
    #autocompactionInterval = config.autocompactionInterval || 1000*60*10;
    
    constructor() {
        // init REST API
        this.restApi = nedbRest();
    
        // hash password in users collection via validator function
        this.restApi.setValidator(function(req,res,next) {
            if (req.collection && req.collection === "users" && ( req.method == 'POST' || req.method == 'PUT' )) {
                if (req.body.password && req.body.password !== "") {
                    req.body.hash = hash(req.body.password);
                    req.body.password = undefined;
                }
            }
        });
    
        // init databases
        this.get("pages").ensureIndex({ "fieldName": "parentId"});
        this.get("page_types");
        this.get("sites");
        this.get("users");
    }

    /**
     * get NEDB datastore.
     * new datastore is created, if it not exists
     * @param {string} name 
     */
    get(name) {
        var result = this[name];
        if (!result) {
            result = new nedb({filename: path.join(this.#dbPath, `${name}.db`), autoload:true});
            result.persistence.setAutocompactionInterval(this.#autocompactionInterval);
            this.restApi.addDatastore(name, result);  
            this[name] = result;
        }
        return result;
    };

    /**
     * query pages
     * @param {*} selector 
     * @param {*} projection 
     * @param {*} sort 
     * @param {*} limit 
     * @returns {Promise}
     */
    findPages(selector, projection, sort, limit) {
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
    }

    /**
     * reads a single page
     * @param {string} _id 
     * @param {NeDB Projection} projection 
     * @returns {Promise}
     */
    getPage(_id, projection) {
        return new Promise(function(resolve, reject) {
            var cursor = this.pages.findOne({"_id":_id});
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
    }

    /**
     * reads children of a parent page 
     * @param {*} _id 
     * @param {*} projection 
     */
    getChildren(_id, projection) {
        if (typeof(_id) === "undefined") {
            var _id = null;
        }
        return this.findPages({parentId: _id, published: true }, projection, {sort:1});
    }
};

module.exports = new database();