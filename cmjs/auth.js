const session  = require("./session")
    , database = require("./database")
    , config   = require('./config.json')
    , hash     = require('./hash')
    ;
const { resolve } = require("path");
const { nextTick } = require("process");

function _checkUser(req) {
  oUser = req.body;
  const oSession = session.getById(req.cookies.cmjs);
  return new Promise(function(resolve, reject) {
    if (oSession) {
      resolve();
    }
    else {
      if (!oUser) {
        reject();
      }
      else {
        database.users.findOne({ _id: oUser.user }, function(err,doc){
          if (err || !doc) {
            reject();
          }
          else {
            const password = hash(oUser.password);
            if (password !== doc.hash) {
              reject();
            }
            else {
              resolve();
            }
          }
        });
      }
    }
  });
}

const result = {

  protect: function (req, res, next) {
    _checkUser(req)
    .then(function() {
      next();
    })
    .catch(function() {
      res.statusCode = 401;
      res.end('Access denied');        
    });
  },

  login: function (req, res, next) {
    _checkUser(req)
    .then(function(){
      res.locals.session  = session.getOrCreate(req);
      res.cookie("cmjs", res.locals.session._id);
      res.json(res.locals.session);
    })
    .catch(function() {
      res.statusCode = 401;
      res.end('Access denied');
    });
  }
};


module.exports = result;