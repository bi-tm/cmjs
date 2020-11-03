var pouchDB       = require('pouchdb')
  , pouchDbFind   = require("pouchdb-find")
  , adapterMemory = require('pouchdb-adapter-memory')
  , config        = require("../config.json");

var database = {};

pouchDB.plugin(adapterMemory);
pouchDB.plugin(pouchDbFind);
pouchDB.defaults({
    adapter: 'memory'
});

var syncPromises = [];

for(var db of config.pouchdb.databases) {
    var localDB = new pouchDB(db.name, {adapter: "memory"});
    database[db.name] = localDB;

    if (config.pouchdb.sync) {      
      var sync = new Promise(function(resolve,reject) {
        var remoteDB = new pouchDB(config.pouchdb.sync.url + db.name, {
            auth: {
                  username: config.pouchdb.sync.username,
                  password: config.pouchdb.sync.password
              },
              ajax: {
                  rejectUnauthorized: false
              }
        });
        pouchDB.sync(remoteDB, localDB, {
              live: true,
              retry: true
        }).on('change', function (info) {
            console.log('pouchdb replication change');
        }).on('paused', function (err) {
            console.log('pouchdb replication paused');
            resolve();  
        }).on('active', function () {
            console.log('pouchdb replication active');
        }).on('denied', function (err) {
            console.error('pouchdb replication denied');
        }).on('complete', function (info) {
            console.log('pouchdb replication of database complete');
        }).on('error', function (err) {
            console.error("pouchdb replication error " + err);
            reject();
        });            
      });
      
      syncPromises.push(sync);
    }
}

module.exports = { pouchDB: pouchDB, database: database, sync: Promise.all(syncPromises) };