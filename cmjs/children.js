const { database } = require("./database");
    

module.exports = {

    get: function (_id, additionalFields) {
        if (typeof(_id) === "undefined") {
            var _id = null;
        }
        var fields = ['_id', "title", "menuTitle", "parentId"];
        if (Array.isArray(additionalFields)) {
            fields = fields.concat(additionalFields);
        }
        return database.pages.createIndex({ name: 'menu', index: { fields: ['parentId', 'published', 'sort'] } })
            .then(function () {
                return database.pages.find({
                    selector: { parentId: _id, published: true },
                    fields: fields,
                    sort: ['parentId', 'published', 'sort']
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