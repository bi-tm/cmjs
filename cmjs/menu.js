const database = require("./database");
    
// read menu at start
var menuPromise = null;

module.exports = {

    get: function (refresh) {
        if (refresh || !menuPromise) {
            menuPromise = database.getChildren(null,{_id: 1, title:1, menuTitle:1, parentId: 1, showInMenu:1})
                .then(function(data) {
                    data = data.filter(m => m.showInMenu);
                    return Promise.resolve(data);
                });
        }
        return menuPromise;
    }
};