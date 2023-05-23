const database = require("./database");

// read menu at start
var menuPromise = null;

module.exports = {

    /**
     * create main menu
     * @param {string} siteId 
     * @param {boolean} refresh 
     * @returns 
     */
    get: function (siteId, refresh) {
        if (refresh || !menuPromise) {
            menuPromise = database.getChildren(siteId, null, { _id: 1, title: 1, menuTitle: 1, parentId: 1, showInMenu: 1 })
                .then(function (data) {
                    data = data.filter(m => m.showInMenu);
                    return Promise.resolve(data);
                });
        }
        return menuPromise;
    }
};