const database = require("./database");
    

module.exports = {

    get: function (_id, additionalFields) {
        if (typeof(_id) === "undefined") {
            var _id = null;
        }
        var fields = {_id: 1, title:1, menuTitle:1, parentId: 1};
        if (Array.isArray(additionalFields)) {
            for (var f of additionalFields) {
                fields[f] = 1;
            }
        }
        return database.findPages({parentId: _id, published: true }, fields, {sort:1});
    }

};