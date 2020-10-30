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

for(var pouchConfig of config.pouchdb) {
  
  var localDB = new pouchDB(pouchConfig.name, {adapter: "memory"});
  database[pouchConfig.name] = localDB;

  if (pouchConfig.sync) {
    var remoteDB = new pouchDB(pouchConfig.sync.url, {
        auth: {
            username: pouchConfig.sync.username,
            password: pouchConfig.sync.password
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
    }).on('active', function () {
        console.log('pouchdb replication active');
    }).on('denied', function (err) {
        console.error('pouchdb replication denied');
    }).on('complete', function (info) {
        console.log('pouchdb replication of database complete');
    }).on('error', function (err) {
        console.error("pouchdb replication error " + err);
    });            
  }
}

module.exports = { pouchDB: pouchDB, database: database };