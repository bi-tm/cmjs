const { database } = require("./database");
    

module.exports = {

    get: function (_id) {
        if (typeof(_id) === "undefined") {
            var _id = null;
        }
        return database.pages.createIndex({ name: 'menu', index: { fields: ['parentId', 'showInMenu', 'published', 'sort'] } })
            .then(function () {
                return database.pages.find({
                    selector: { parentId: _id, showInMenu: true, published: true },
                    fields: ['_id', "title", "menuTitle", "parentId"],
                    sort: ['parentId', 'showInMenu', 'published', 'sort']
                });
            })
            .then(function(result){
                return result.docs;
            })
            .catch(function (err) {
                console.error(`error children.js ${err}`);
            });
    }
};