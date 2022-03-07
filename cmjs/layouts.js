const database     = require("./database");

var result = {

    layouts: {},

    /**
     * get layout for host
     * @param {string} sHost 
     * @returns {string} layout
     */
    get_by_host: function(sHost) {
        const host = sHost.split(":",1)[0];
        return this.layouts[host] || "default.hbs";
    },

    /**
     * create map of layouts per domain
     */
    refresh: function() {
        this.layouts = {};
        return new Promise(function(resolve, reject) {
            database.sites.find({}, function(err, sites){
                for(var site of sites) {
                    for(var domain of site.domains) {
                        this.layouts[domain] = site.layout;
                    }
                }
                resolve();
            }.bind(this));
        }.bind(this));
    }
}    

result.refresh();
module.exports = result;