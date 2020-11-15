const { database } = require("./database");
    
// read menu at start
var menuPromise = null;

module.exports = {

    get: function (refresh) {
        if (refresh || !menuPromise) {
            menuPromise = database.pages.createIndex({ name: 'menu', index: { fields: ['parentId', 'showInMenu', 'published', 'sort'] } })
                .then(function () {
                    return database.pages.find({
                        selector: { parentId: null, showInMenu: true, published: true },
                        fields: ['_id', "title", "menuTitle"],
                        sort: ['parentId', 'showInMenu', 'published', 'sort']
                    });
                })
                .then(function (result) {
                    return Promise.resolve(result.docs.map(m => {
                        if (typeof (m.menuTitle) !== "string" || !m.menuTitle.length) {
                            m.menuTitle = m.title;
                        }
                        return m;
                    }));
                })
                .catch(function (err) {
                    console.error(err);
                });
        }
        return menuPromise;
    }
};