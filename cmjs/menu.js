const children = require("./children");
    
// read menu at start
var menuPromise = null;

module.exports = {

    get: function (refresh) {
        if (refresh || !menuPromise) {
            menuPromise = children.get(null,["showInMenu"])
                .then(function(data) {
                    data = data.filter(m => m.showInMenu);
                    return Promise.resolve(data);
                });
        }
        return menuPromise;
    }
};