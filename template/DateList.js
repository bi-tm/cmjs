const children = require("../cmjs/children");
module.exports = {

    /**
     * this function is called before rendering
     * it must return a Promise
     * here you can read additional data asynchronously
     * @param {object} content 
     * @returns {Promise}
     */
    beforeRendering: function(content) {
        return children.get(content._id,["dateFrom","dateTo"])
            .then(function(result){
                const now = new Date();
                content.children = result.filter(child => new Date(child.dateTo) >= now);
            });
    }
};