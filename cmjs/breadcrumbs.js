const database = require("./database");

async function _getBreadcrumbs(_id) {
    var breadcrumbs = [];
    var doc = await database.getPage(_id, {_id:1, menuTitle:1, parentId:1});
    while (doc) {
        breadcrumbs.splice(0, 0, doc);
        if (doc.parentId) {
            doc = await database.getPage(doc.parentId, {_id:1, menuTitle:1, parentId:1});
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