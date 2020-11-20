const { database } = require("./database");


function read(_id, breadcrumbs) {
    return database.pages.get(_id)
    .then(function(oPage){
        breadcrumbs.splice(0, 0, oPage);
        if (oPage.parentId) {
            return read(oPage.parentId, breadcrumbs)
        }
        else {
            return Promise.resolve(breadcrumbs);
        }
    });
}

module.exports = {

    get: function(_id) {
        return read(_id, []);
    }

};