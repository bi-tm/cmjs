const database = require("./database");


function _read(_id) {
    return new Promise(function(resolve,reject){
        database.pages.findOne({_id:_id})
        .projection({_id:1, menuTitle:1, parentId:1})
        .exec(function(err,doc){
            if (err) {
                reject(err);
            }
            else if (!doc) {
                reject("unkonwn page " + _id);
            }
            else {
                resolve(doc);
            }
        })
    });
}

async function _getBreadcrumbs(_id) {
    var breadcrumbs = [];
    var doc = await _read(_id);
    while (doc) {
        breadcrumbs.splice(0, 0, doc);
        if (doc.parentId) {
            doc = await _read(doc.parentId);
        }
        else {
            doc = null;
        }
    }
    return breadcrumbs;
}

module.exports = {

    get: function(_id) {
        return _getBreadcrumbs(_id);
    }

};